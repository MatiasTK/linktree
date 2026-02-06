# Mejoras Recomendadas para el Proyecto Linktree

Este documento contiene un análisis del proyecto y mejoras recomendadas para aplicar a futuro.

---

## Stack Tecnológico Actual

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 15 (App Router) + React 19 |
| Runtime | Cloudflare Workers (Edge) |
| Base de Datos | Cloudflare D1 (SQLite) |
| Estilos | Tailwind CSS 4 |
| Iconos | Lucide React |
| Drag & Drop | @dnd-kit |
| Lenguaje | TypeScript (modo estricto) |

---

## Lo Que Está Bien Hecho

### 1. Arquitectura de Componentes (Atomic Design)

El proyecto sigue correctamente Atomic Design con 4 niveles:

```
src/components/
├── atoms/       → Button, Input, Select, Toggle, Spinner, Icon
├── molecules/   → FormField, IconButton, StatCard, EmptyState
├── organisms/   → Modal, LinkCard, LinkForm, AdminSidebar
└── templates/   → AdminPageTemplate
```

### 2. Separación de Concerns con Custom Hooks

Los hooks encapsulan la lógica de negocio, separándola de la UI:
- `useLinks` - CRUD de links
- `useSections` - CRUD de secciones
- `useSettings` - Configuración global
- `useModal` - Gestión de modales

### 3. Validación Robusta

`src/lib/validation.ts` implementa:
- Bloqueo de protocolos peligrosos (`javascript:`, `data:`, `vbscript:`)
- HTTPS obligatorio para imágenes
- Límites de longitud configurables
- Sanitización de strings

### 4. Seguridad

- SHA-256 + salt para passwords
- HMAC-signed sessions (7 días)
- Rate limiting (5 intentos / 15 min, lockout 30 min)
- Constant-time comparison contra timing attacks

### 5. Edge-First Architecture

Buena elección con Cloudflare Workers + D1 para baja latencia global.

---

## Mejoras Recomendadas

### 1. Agregar Librería de Validación de Schemas (Zod)

**Problema**: La validación manual en `validation.ts` es verbosa y propensa a errores.

**Solución**: Usar [Zod](https://zod.dev/) (compatible con edge runtime).

```bash
pnpm add zod
```

**Ejemplo de implementación**:

```typescript
// src/lib/schemas.ts
import { z } from 'zod';
import { AVAILABLE_ICONS } from './types';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export const LinkSchema = z.object({
  section_id: z.number().int().positive(),
  label: z.string().min(1, 'Label is required').max(100),
  url: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ALLOWED_PROTOCOLS.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL. Must be http, https, mailto, or tel protocol.' }
  ),
  icon_type: z.enum(AVAILABLE_ICONS).default('link'),
  is_visible: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  group_title: z.string().max(50).nullable().default(null),
  group_order: z.number().int().min(0).default(0),
});

export const SectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  slug: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  show_in_main: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
});

export type LinkInput = z.infer<typeof LinkSchema>;
export type SectionInput = z.infer<typeof SectionSchema>;
```

**Uso en API routes**:

```typescript
// src/app/api/links/route.ts
import { LinkSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  const body = await request.json();
  const result = LinkSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const validatedData = result.data;
  // ...continuar con datos validados
}
```

---

### 2. Centralizar Manejo de Errores en API

**Problema**: Los try/catch se repiten en cada API route.

**Solución**: Crear un wrapper de API.

```typescript
// src/lib/api-handler.ts
import { requireAuth, unauthorizedResponse } from './auth';
import { NextResponse } from 'next/server';

interface ApiHandlerOptions {
  requireAuth?: boolean;
}

type ApiHandler<T> = (request: Request, context?: unknown) => Promise<T>;

export function withApiHandler<T>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  return async (request: Request, context?: unknown) => {
    try {
      if (options.requireAuth) {
        try {
          await requireAuth();
        } catch {
          return unauthorizedResponse();
        }
      }

      const data = await handler(request, context);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('API Error:', error);

      const message = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      const status = error instanceof ValidationError ? 400 : 500;

      return NextResponse.json(
        { success: false, error: message },
        { status }
      );
    }
  };
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

**Uso**:

```typescript
// src/app/api/links/route.ts
import { withApiHandler } from '@/lib/api-handler';

export const POST = withApiHandler(
  async (request) => {
    const body = await request.json();
    // lógica...
    return newLink;
  },
  { requireAuth: true }
);
```

---

### 3. Optimizar Reordenamiento con Batch API

**Problema**: El reordenamiento hace N requests secuenciales (una por item).

```typescript
// Código actual problemático
for (let i = 0; i < reorderedLinks.length; i++) {
  await fetch(`/api/links/${link.id}`, {...}); // ❌ N requests
}
```

**Solución**: Crear endpoint de batch update.

```typescript
// src/app/api/links/reorder/route.ts
import { withApiHandler } from '@/lib/api-handler';
import { execute } from '@/lib/db';
import { z } from 'zod';

const ReorderSchema = z.object({
  orders: z.array(z.object({
    id: z.number().int().positive(),
    display_order: z.number().int().min(0),
  })),
});

export const POST = withApiHandler(
  async (request) => {
    const body = await request.json();
    const { orders } = ReorderSchema.parse(body);

    // Usar transacción para atomicidad
    const statements = orders.map(({ id, display_order }) => ({
      sql: 'UPDATE links SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      params: [display_order, id],
    }));

    // D1 soporta batch de statements
    await execute(
      statements.map(s => s.sql).join('; '),
      statements.flatMap(s => s.params)
    );

    return { updated: orders.length };
  },
  { requireAuth: true }
);
```

**Actualizar el hook**:

```typescript
// src/hooks/useLinks.ts
const reorderLinks = useCallback(
  async (reorderedLinks: LinkType[]) => {
    setLinks(reorderedLinks); // Optimistic update

    const orders = reorderedLinks.map((link, index) => ({
      id: link.id,
      display_order: index,
    }));

    try {
      await fetch('/api/links/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });
    } catch (error) {
      console.error('Error reordering:', error);
      fetchLinks(); // Rollback en caso de error
    }
  },
  [fetchLinks]
);
```

---

### 4. Implementar React Query (TanStack Query)

**Problema**: El manejo de estado servidor/cliente es manual con useState + useEffect.

**Solución**: Usar [TanStack Query](https://tanstack.com/query/latest).

```bash
pnpm add @tanstack/react-query
```

**Setup**:

```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Refactorizar useLinks**:

```typescript
// src/hooks/useLinks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const linksApi = {
  getAll: async (sectionId?: string) => {
    const url = sectionId ? `/api/links?sectionId=${sectionId}` : '/api/links';
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data as LinkType[];
  },

  create: async (formData: LinkFormData) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // ...otros métodos
};

export function useLinks(filterSection?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const linksQuery = useQuery({
    queryKey: ['links', filterSection],
    queryFn: () => linksApi.getAll(filterSection),
  });

  const createMutation = useMutation({
    mutationFn: linksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('Link created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    links: linksQuery.data ?? [],
    loading: linksQuery.isLoading,
    error: linksQuery.error,
    createLink: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    // ...
  };
}
```

**Beneficios**:
- Caché automático
- Revalidación inteligente
- Estados de loading/error automáticos
- Optimistic updates simplificados
- Deduplicación de requests

---

### 5. Agregar Tests

**Problema**: No hay tests en el proyecto.

**Solución**: Implementar Vitest + Playwright.

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event playwright @playwright/test
```

**Configuración Vitest**:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Ejemplo de test unitario**:

```typescript
// src/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateUrl, validateSlug, sanitizeString } from './validation';

describe('validateUrl', () => {
  it('accepts valid http URLs', () => {
    expect(validateUrl('https://example.com')).toBe('https://example.com');
    expect(validateUrl('http://example.com')).toBe('http://example.com');
  });

  it('accepts mailto and tel protocols', () => {
    expect(validateUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(validateUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('rejects dangerous protocols', () => {
    expect(validateUrl('javascript:alert(1)')).toBeNull();
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(validateUrl('vbscript:msgbox(1)')).toBeNull();
  });

  it('rejects invalid URLs', () => {
    expect(validateUrl('not-a-url')).toBeNull();
    expect(validateUrl('')).toBeNull();
  });
});

describe('validateSlug', () => {
  it('accepts valid slugs', () => {
    expect(validateSlug('my-page')).toBe('my-page');
    expect(validateSlug('page123')).toBe('page123');
  });

  it('converts to lowercase', () => {
    expect(validateSlug('My-Page')).toBe('my-page');
  });

  it('rejects invalid slugs', () => {
    expect(validateSlug('my page')).toBeNull(); // spaces
    expect(validateSlug('-start')).toBeNull();  // leading hyphen
    expect(validateSlug('end-')).toBeNull();    // trailing hyphen
  });
});
```

**Ejemplo de test E2E con Playwright**:

```typescript
// tests/e2e/admin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // En dev mode, auto-authenticates
    await page.goto('/admin');
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.getByText('Total Links')).toBeVisible();
    await expect(page.getByText('Total Clicks')).toBeVisible();
  });

  test('should create a new link', async ({ page }) => {
    await page.goto('/admin/links');
    await page.click('text=Add Link');

    await page.fill('input[placeholder="e.g. My GitHub"]', 'Test Link');
    await page.fill('input[placeholder="https://..."]', 'https://example.com');

    await page.click('button:has-text("Create")');

    await expect(page.getByText('Link created successfully')).toBeVisible();
  });
});
```

**Scripts en package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

### 6. Implementar React Hook Form

**Problema**: Los formularios manejan estado manualmente.

**Solución**: Usar [React Hook Form](https://react-hook-form.com/) + Zod.

```bash
pnpm add react-hook-form @hookform/resolvers
```

**Refactorizar LinkForm**:

```typescript
// src/components/organisms/LinkForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinkSchema, type LinkInput } from '@/lib/schemas';
import { Button, Input, Select, Toggle } from '@/components/atoms';
import { FormField, IconSelector } from '@/components/molecules';

interface LinkFormProps {
  defaultValues?: Partial<LinkInput>;
  sections: Section[];
  isEditing: boolean;
  onSubmit: (data: LinkInput) => Promise<void>;
  onCancel: () => void;
}

export function LinkForm({
  defaultValues,
  sections,
  isEditing,
  onSubmit,
  onCancel,
}: LinkFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LinkInput>({
    resolver: zodResolver(LinkSchema),
    defaultValues: {
      section_id: sections[0]?.id,
      label: '',
      url: '',
      icon_type: 'link',
      is_visible: true,
      display_order: 0,
      group_title: null,
      group_order: 0,
      ...defaultValues,
    },
  });

  const iconType = watch('icon_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Section" required error={errors.section_id?.message}>
        <Select {...register('section_id', { valueAsNumber: true })}>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Label" required error={errors.label?.message}>
        <Input
          {...register('label')}
          placeholder="e.g. My GitHub"
        />
      </FormField>

      <FormField label="URL" required error={errors.url?.message}>
        <Input
          {...register('url')}
          placeholder="https://..."
        />
      </FormField>

      <FormField label="Icon">
        <IconSelector
          value={iconType}
          onChange={(icon) => setValue('icon_type', icon)}
        />
      </FormField>

      <Toggle
        label="Visible"
        {...register('is_visible')}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

**Beneficios**:
- Validación automática con Zod
- Mejor performance (menos re-renders)
- Estados de submitting automáticos
- Errores por campo

---

### 7. Mejorar Función `cn()` con tailwind-merge

**Problema**: La función actual no maneja conflictos de clases Tailwind.

```typescript
// Actual - puede generar conflictos
cn('p-4', 'p-2') // → 'p-4 p-2' (ambas se aplican, resultado impredecible)
```

**Solución**:

```bash
pnpm add clsx tailwind-merge
```

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ahora maneja conflictos correctamente
cn('p-4', 'p-2') // → 'p-2' (la última gana)
cn('text-red-500', condition && 'text-blue-500') // → maneja condicionales
```

---

### 8. Variables de Entorno Tipadas

**Problema**: Las variables de entorno no tienen validación en runtime.

**Solución**: Usar [@t3-oss/env-nextjs](https://env.t3.gg/).

```bash
pnpm add @t3-oss/env-nextjs
```

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ADMIN_PASSWORD_HASH: z.string().min(1, 'ADMIN_PASSWORD_HASH is required'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  client: {
    // Variables públicas (NEXT_PUBLIC_*)
  },
  runtimeEnv: {
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

**Uso**:

```typescript
import { env } from '@/env';

// Tipado y validado
const hash = env.ADMIN_PASSWORD_HASH; // string (garantizado)
```

---

### 9. Memoización de Componentes de Lista

**Problema**: Componentes de lista se re-renderizan innecesariamente.

**Solución**: Usar `React.memo`.

```typescript
// src/components/organisms/LinkListItem.tsx
import { memo } from 'react';

interface LinkListItemProps {
  link: LinkType;
  sectionName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export const LinkListItem = memo(function LinkListItem({
  link,
  sectionName,
  onEdit,
  onDelete,
  onToggleVisibility,
}: LinkListItemProps) {
  // ...render
});

// Para callbacks, usar useCallback en el componente padre
const handleEdit = useCallback(() => {
  handleOpenForm(link);
}, [link, handleOpenForm]);
```

---

### 10. Logging Estructurado

**Problema**: Solo `console.error` para debugging.

**Solución**: Implementar logger con contexto.

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  withContext(ctx: LogContext) {
    const logger = new Logger();
    logger.context = { ...this.context, ...ctx };
    return logger;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
    };

    if (process.env.NODE_ENV === 'production') {
      // En producción, formato JSON para parsing
      console[level](JSON.stringify(entry));
    } else {
      // En desarrollo, formato legible
      console[level](`[${level.toUpperCase()}] ${message}`, entry);
    }
  }

  debug(message: string, data?: unknown) { this.log('debug', message, data); }
  info(message: string, data?: unknown) { this.log('info', message, data); }
  warn(message: string, data?: unknown) { this.log('warn', message, data); }
  error(message: string, data?: unknown) { this.log('error', message, data); }
}

export const logger = new Logger();
```

**Uso en API routes**:

```typescript
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = logger.withContext({ requestId, action: 'createLink' });

  log.info('Creating new link');

  try {
    // ...
    log.info('Link created successfully', { linkId: newLink.id });
  } catch (error) {
    log.error('Failed to create link', { error });
    throw error;
  }
}
```

---

## Resumen de Prioridades

| Prioridad | Mejora | Impacto | Esfuerzo |
|-----------|--------|---------|----------|
| **Alta** | Tests (Vitest + Playwright) | Confiabilidad | Alto |
| **Alta** | Batch reorder API | Performance | Bajo |
| **Media** | Zod para validación | Mantenibilidad | Medio |
| **Media** | React Query/SWR | UX + código | Medio |
| **Media** | React Hook Form | Código limpio | Medio |
| **Baja** | tailwind-merge en cn() | Evitar bugs CSS | Bajo |
| **Baja** | Variables env tipadas | DX | Bajo |
| **Baja** | Logging estructurado | Debugging | Bajo |
| **Baja** | Memoización componentes | Performance | Bajo |

---

## Orden de Implementación Sugerido

### Fase 1: Fundamentos
1. Instalar y configurar Zod
2. Instalar tailwind-merge y actualizar `cn()`
3. Configurar variables de entorno tipadas

### Fase 2: Testing
4. Configurar Vitest
5. Escribir tests para `validation.ts` y `auth.ts`
6. Configurar Playwright para E2E básicos

### Fase 3: Data Fetching
7. Implementar endpoint de batch reorder
8. Instalar y configurar React Query
9. Migrar hooks a React Query

### Fase 4: Formularios
10. Instalar React Hook Form
11. Migrar formularios existentes

### Fase 5: Optimizaciones
12. Agregar memoización a componentes de lista
13. Implementar logging estructurado
14. Centralizar manejo de errores en API

---

## Dependencias a Agregar

```bash
# Validación
pnpm add zod

# Utilidades CSS
pnpm add clsx tailwind-merge

# Data Fetching
pnpm add @tanstack/react-query

# Formularios
pnpm add react-hook-form @hookform/resolvers

# Variables de entorno
pnpm add @t3-oss/env-nextjs

# Testing
pnpm add -D vitest @vitejs/plugin-react jsdom
pnpm add -D @testing-library/react @testing-library/user-event
pnpm add -D playwright @playwright/test
```

---

*Documento generado el 31 de enero de 2026*
