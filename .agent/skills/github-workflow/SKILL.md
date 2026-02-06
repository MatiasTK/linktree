---
name: github-workflow
description: GitHub CLI workflow for personal projects. Use when creating feature branches, pull requests, releases, or managing issues. Implements a simple main/develop branching strategy.
---

# GitHub Workflow Skill

Este skill define el flujo de trabajo para gestionar el repositorio usando GitHub CLI (`gh`).

## Cuándo usar este skill

- Cuando necesites crear una nueva **feature branch**
- Cuando quieras crear un **PR** hacia develop o main
- Para hacer **merge** de PRs aprobados
- Para crear **releases** a producción
- Para gestionar **issues** con GitHub CLI
- Para verificar el **estado** de PRs y checks de CI

## Árbol de Decisiones

```
¿Qué necesitas hacer?
│
├─► Empezar trabajo nuevo
│   └─► Crear Feature Branch (Sección 1)
│
├─► Terminé mi feature
│   └─► ¿Ya hiciste push?
│       ├─► No → git push + Crear PR a Develop (Sección 2)
│       └─► Sí → Crear PR a Develop (Sección 2)
│
├─► PR aprobado
│   └─► Merge de PR (Sección 3)
│
├─► Quiero deployar a producción
│   └─► Crear Release develop → main (Sección 4)
│       └─► Después: Sincronizar Ramas (Sección 5)
│
├─► Gestionar issues
│   └─► Ver Gestión de Issues (Sección 6)
│
└─► Ver estado del repo
    └─► Ver Estado del Repositorio (Sección 7)
```

---

## Estructura de Ramas

- **main**: Rama de producción, siempre estable
- **develop**: Rama de desarrollo, donde se integran las features

## Flujo de Trabajo

```
feature/* ──> develop ──> main
     │            │          │
   (PR)        (merge)    (release)
```

---

## Comandos Disponibles

### 1. Crear Feature Branch

Cuando necesites trabajar en una nueva funcionalidad:

```bash
# Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear nueva rama de feature
git checkout -b feature/<nombre-descriptivo>
```

### 2. Crear Pull Request a Develop

Cuando termines una feature, crear PR hacia develop:

```bash
# Primero, hacer push de la rama
git push -u origin feature/<nombre-feature>

# Crear PR hacia develop
// turbo
gh pr create --base develop --title "<título>" --body "<descripción>"
```

**Opciones útiles:**

- `--draft`: Crear como borrador
- `--label "<label>"`: Agregar etiquetas
- `--assignee "@me"`: Auto-asignarse

### 3. Merge de PR

Para mergear un PR aprobado:

```bash
// turbo
gh pr merge <número-pr> --squash --delete-branch
```

**Opciones de merge:**

- `--squash`: Combinar commits en uno (recomendado para features)
- `--merge`: Merge commit tradicional
- `--rebase`: Rebase y merge

### 4. Crear Release (develop → main)

Para hacer release a producción:

```bash
# Crear PR de develop a main
// turbo
gh pr create --base main --head develop --title "Release: <versión>" --body "<changelog>"

# Después de merge, crear tag de release
// turbo
gh release create v<versión> --target main --generate-notes
```

### 5. Sincronizar Ramas Post-Release

Después de un release, sincronizar develop con main:

```bash
git checkout develop
git pull origin develop
git merge origin/main
git push origin develop
```

---

## Gestión de Issues

### Crear Issue

```bash
// turbo
gh issue create --title "<título>" --body "<descripción>"
```

**Opciones útiles:**

- `--label "bug"` o `--label "enhancement"`: Clasificar
- `--assignee "@me"`: Auto-asignarse

### Listar Issues

```bash
// turbo
gh issue list
```

### Cerrar Issue con PR

Al crear el PR, referenciar el issue:

```bash
gh pr create --base develop --title "Fix: <descripción>" --body "Closes #<número-issue>"
```

---

## Ver Estado del Repositorio

### Ver PRs abiertos

```bash
// turbo
gh pr list
```

### Ver estado del PR actual

```bash
// turbo
gh pr status
```

### Ver checks/CI del PR

```bash
// turbo
gh pr checks
```

---

## Flujo Completo de Ejemplo

```bash
# 1. Empezar feature
git checkout develop && git pull
git checkout -b feature/nueva-funcionalidad

# 2. Trabajar y commitear
git add . && git commit -m "feat: descripción"

# 3. Crear PR
git push -u origin feature/nueva-funcionalidad
gh pr create --base develop --title "feat: Nueva funcionalidad" --body "Descripción detallada"

# 4. Después de aprobación, merge
gh pr merge --squash --delete-branch

# 5. Para release
gh pr create --base main --head develop --title "Release: v1.0.0"
gh pr merge --merge
gh release create v1.0.0 --target main --generate-notes
```

---

## Tips

1. **Conventional Commits**: Usar prefijos como `feat:`, `fix:`, `docs:`, `refactor:`
2. **PRs pequeños**: Mantener PRs enfocados en una sola cosa
3. **Draft PRs**: Usar `--draft` para trabajo en progreso
4. **Auto-merge**: Configurar con `gh pr merge --auto` para merge automático después de CI
