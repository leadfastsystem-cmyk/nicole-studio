import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MOODBOARD_BASE = `Eres Nicole, asistente de diseño de joyería para Majorica (perlas y joyería elegante).

Analiza las imágenes del moodboard que te envío y responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, con esta estructura exacta:

{
  "adn": {
    "lineas": "1 frase: tipo de líneas y formas dominantes (ej: orgánicas, curvas, geométricas).",
    "texturas": "1 frase: texturas y materiales que se perciben.",
    "energia": "1 frase: sensación general (ej: minimal, escultórico, romántico)."
  },
  "piezas": [
    "Pieza 1: nombre corto. 2 frases máximo: descripción técnica concreta (forma, material, detalle).",
    "Pieza 2: ...",
    "Pieza 3: ..."
  ]
}

Reglas:
- Máximo 3 piezas. Cada una en 2 frases.
- Lenguaje de diseñadora: concreto, técnico, sin marketing.
- Si las imágenes no dan suficiente señal para proponer piezas sólidas, devuelve este JSON en su lugar:
{
  "needMoreInfo": true,
  "whatISee": "2-3 frases describiendo qué sí se ve en el moodboard (formas, colores, estilo).",
  "questions": ["Pregunta 1 concreta?", "Pregunta 2?", "Pregunta 3?"]
}
- Responde solo con el JSON, nada más.`;

function buildPrompt(context?: string): string {
  if (!context || !context.trim()) return MOODBOARD_BASE;
  return `CONTEXTO ADICIONAL proporcionado por la diseñadora (usa esta información para afinar el ADN y las piezas):

"""
${context.trim()}
"""

---

${MOODBOARD_BASE}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not set' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as {
      images?: string[];
      context?: string;
    };
    const images = body.images ?? [];
    const context = typeof body.context === 'string' ? body.context : undefined;

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Envíame al menos una imagen del moodboard.' },
        { status: 400 },
      );
    }

    if (images.length > 3) {
      return NextResponse.json(
        { error: 'Máximo 3 imágenes por moodboard.' },
        { status: 400 },
      );
    }

    const prompt = buildPrompt(context);
    const content: { type: string; text?: string; image_url?: { url: string } }[] = [
      { type: 'text', text: prompt },
    ];

    for (const dataUrl of images) {
      if (dataUrl && (dataUrl.startsWith('data:image') || dataUrl.startsWith('http'))) {
        content.push({
          type: 'image_url',
          image_url: { url: dataUrl },
        });
      }
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content }],
        max_tokens: 800,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OpenAI vision error:', errText);
      return NextResponse.json(
        { error: 'No pude analizar el moodboard. Revisa la conexión o intenta con otras imágenes.' },
        { status: 502 },
      );
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';

    let json: Record<string, unknown>;
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      json = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        needMoreInfo: true,
        whatISee: 'Vi las imágenes pero no pude estructurar una respuesta. ¿Puedes contarme en 1–2 frases el contexto de esta colección (público, tipo de pieza principal)?',
        questions: [
          '¿Para qué tipo de piezas es este moodboard (pendientes, collares, anillos)?',
          '¿Las perlas son protagonistas o solo un detalle?',
          '¿Público más joven/minimal o más clásico?',
        ],
      });
    }

    if (json.needMoreInfo === true) {
      return NextResponse.json({
        needMoreInfo: true,
        whatISee: json.whatISee || 'Necesito un poco más de contexto.',
        questions: Array.isArray(json.questions) ? json.questions : [],
      });
    }

    return NextResponse.json({
      adn: json.adn || {},
      pieces: Array.isArray(json.piezas) ? json.piezas : [],
    });
  } catch (error) {
    console.error('Moodboard analyze error:', error);
    return NextResponse.json(
      { error: 'Error al analizar el moodboard.' },
      { status: 500 },
    );
  }
}
