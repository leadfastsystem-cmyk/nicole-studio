import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/lib/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type Provider = 'openrouter' | 'openai';

interface ModelConfig {
  id: string;
  provider: Provider;
  apiModel: string;
}

const MODEL_MAP: Record<string, ModelConfig> = {};

for (const m of AVAILABLE_MODELS) {
  // Para ahora, apiModel = id tal cual
  MODEL_MAP[m.id] = {
    id: m.id,
    provider: m.provider as Provider,
    apiModel: m.id.includes('/') ? m.id.split('/').slice(1).join('/') : m.id,
  };
}

const SYSTEM_PROMPT = `Eres un asistente de diseño de joyería especializado en Majorica.

Tu objetivo es ayudar a una diseñadora a transformar moodboards e ideas en piezas de joyería concretas.

Estilo de respuesta:
- Responde SIEMPRE en español.
- Máximo 3–4 frases por respuesta.
- No uses formato markdown (nada de **negritas**, listas ni títulos).
- Usa frases cortas y claras, fáciles de leer.
- Si la petición es muy amplia, centra la respuesta en 1–2 ideas principales.`;

export async function POST(req: NextRequest) {
  try {
    const { message, model } = (await req.json()) as {
      message?: string;
      model?: string;
    };

    const text = (message || '').trim();
    if (!text) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 },
      );
    }

    const modelId = model && MODEL_MAP[model] ? model : DEFAULT_MODEL.id;
    const cfg = MODEL_MAP[modelId];

    let content = '';
    let tokensInput = 0;
    let tokensOutput = 0;

    try {
      if (cfg.provider === 'openrouter') {
        if (!OPENROUTER_API_KEY) {
          throw new Error('OPENROUTER_API_KEY not set');
        }

        const resp = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://nicole-studio.leadfast',
              'X-Title': 'Nicole Studio',
            },
            body: JSON.stringify({
              model: cfg.id,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: text },
              ],
            }),
          },
        );

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(
            `OpenRouter error (${resp.status}): ${errText.slice(0, 300)}`,
          );
        }

        const data = await resp.json();
        content = data.choices?.[0]?.message?.content || '';
        tokensInput = data.usage?.prompt_tokens || 0;
        tokensOutput = data.usage?.completion_tokens || 0;
      } else if (cfg.provider === 'openai') {
        if (!OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not set');
        }

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: cfg.apiModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: text },
            ],
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(
            `OpenAI error (${resp.status}): ${errText.slice(0, 300)}`,
          );
        }

        const data = await resp.json();
        content = data.choices?.[0]?.message?.content || '';
        tokensInput = data.usage?.prompt_tokens || 0;
        tokensOutput = data.usage?.completion_tokens || 0;
      }
    } catch (llmError) {
      console.error('LLM call failed:', llmError);
      // Fallback: respuesta interna para no romper la UX
      content =
        'Ahora mismo no puedo conectar con el modelo de IA seleccionado, pero el flujo de Nicole Studio está funcionando correctamente. ' +
        'Revisa las API keys o el proveedor configurado y vuelve a intentarlo.';
      tokensInput = 0;
      tokensOutput = 0;
    }

    return NextResponse.json({
      content,
      tokensInput,
      tokensOutput,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

