# Crear repo de Nicole Studio en GitHub

Nicole Studio es un proyecto **totalmente separado** de LeadFast Portal.

## Opción 1: GitHub web (manual)

1. Ve a https://github.com/new
2. **Repository name:** `nicole-studio`
3. **Description:** Asistente de diseño de joyería para Majorica
4. **Private** (recomendado)
5. **No** inicialices con README (ya existe)
6. Create repository

Luego en tu terminal:

```bash
cd /root/projects/nicole-studio
git remote add origin https://github.com/TU_USUARIO/nicole-studio.git
git push -u origin main
```

## Opción 2: GitHub CLI

Si tienes `gh` instalado y autenticado:

```bash
cd /root/projects/nicole-studio
gh repo create nicole-studio --private --source=. --push --description "Asistente de diseño de joyería para Majorica"
```

## Después del push

- Conectar el repo en Vercel: https://vercel.com/new → Import Git Repository
- Añadir variables: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`
- Deploy
