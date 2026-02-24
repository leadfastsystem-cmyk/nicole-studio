import { NextRequest, NextResponse } from 'next/server';

// Versión offline: no llama a ningún LLM externo.
// Genera una respuesta de prueba útil para validar el flujo.

export async function POST(req: NextRequest) {
  try {
    const { message } = (await req.json()) as { message?: string };
    const text = (message || '').trim();

    if (!text) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 },
      );
    }

    const content = [
      'He recibido tu mensaje y el flujo completo de Nicole Studio está funcionando sin errores.',
      '',
      'De momento esta es una versión *offline* de prueba, sin conexión a un modelo de IA externo.',
      'Si quieres, en la siguiente iteración conectamos esto a OpenAI / OpenRouter cuando definamos bien el proveedor y las credenciales.',
    ].join('\n');

    return NextResponse.json({
      content,
      tokensInput: 0,
      tokensOutput: 0,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

