import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// DALL-E 3 1024x1024 standard: $0.040 per image
const COST_PER_IMAGE = 0.04;

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not set' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as { piece?: string };
    const piece = (body.piece || '').trim();

    if (!piece) {
      return NextResponse.json(
        { error: 'Falta la descripción de la pieza.' },
        { status: 400 },
      );
    }

    const prompt = `Professional product photography of an elegant jewelry piece for Majorica. ${piece}. Clean white background, minimalist lighting, high-end jewelry catalog style. No text, no watermarks.`;

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('DALL-E error:', errText);
      return NextResponse.json(
        { error: 'No pude generar la imagen. Intenta de nuevo.' },
        { status: 502 },
      );
    }

    const data = await resp.json();
    const b64 = data.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: 'Respuesta inválida del generador.' },
        { status: 502 },
      );
    }

    const dataUrl = `data:image/png;base64,${b64}`;

    return NextResponse.json({
      imageUrl: dataUrl,
      costUsd: COST_PER_IMAGE,
    });
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { error: 'Error al generar la imagen.' },
      { status: 500 },
    );
  }
}
