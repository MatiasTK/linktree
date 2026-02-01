<div align="center">
    <h1>
        Linktree Clone
    </h1>
    <p>
        <img alt="GitHub License" src="https://img.shields.io/github/license/matiastk/linktree">
    </p>
</div>

*Clon de Linktree self-hosted construido sobre la infraestructura edge de Cloudflare.*

## Características Principales

- Secciones personalizables con orden drag-and-drop
- Links con iconos y contador de clicks
- Panel de administración protegido con autenticación
- Modo claro y oscuro
- Rate limiting para protección contra ataques
- Diseño responsivo
- Despliegue en el edge con Cloudflare Workers

## Desarrollo

### Prerequisitos

- Node.js >= 20
- pnpm >= 9

### Build

- Clonar el repositorio
- Instalar las dependencias con `pnpm install`
- Ejecutar migraciones locales con `npx wrangler d1 execute linktree-db --local --file=./migrations/0001_initial.sql`
- Iniciar el servidor de desarrollo con `pnpm dev`

### Despliegue

- Configurar Cloudflare D1 en `wrangler.jsonc`
- Ejecutar migraciones en producción con `npx wrangler d1 execute linktree-db --file=./migrations/0001_initial.sql`
- Desplegar con `pnpm cf-deploy`

## Stack

- [![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/) - Next.js 15 App Router
- [![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/) - React 19
- [![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/) - Cloudflare Workers + D1
- [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) - Tailwind CSS 4
- [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) - TypeScript
