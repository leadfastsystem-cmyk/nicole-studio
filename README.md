# Nicole Studio

Asistente de diseño de joyería para Majorica. Analiza moodboards y propone piezas concretas.

## Stack

- Next.js 16
- OpenAI / OpenRouter (chat + visión)
- Tailwind CSS

## Desarrollo

```bash
npm install
npm run dev
```

## Variables de entorno

Crear `.env.local`:

```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
```

## Deploy (Vercel)

1. Conectar este repo en [Vercel](https://vercel.com)
2. Añadir las variables de entorno
3. Deploy automático en cada push
