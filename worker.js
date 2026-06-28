export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (path.startsWith('/api/')) {
      // ── Board ──────────────────────────────────────────────────────────────

      if (path === '/api/board' && request.method === 'GET') {
        const data = await env.RITUAL_KV.get('board');
        const board = data
          ? JSON.parse(data)
          : { rose: [], bud: [], thorn: [] };
        return new Response(JSON.stringify(board), { headers });
      }

      if (path === '/api/board/card' && request.method === 'POST') {
        const { column, text } = await request.json();
        if (!['rose', 'bud', 'thorn'].includes(column) || !text?.trim()) {
          return new Response(JSON.stringify({ error: 'Invalid input' }), {
            status: 400,
            headers,
          });
        }
        const data = await env.RITUAL_KV.get('board');
        const board = data
          ? JSON.parse(data)
          : { rose: [], bud: [], thorn: [] };
        const card = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          text: text.trim(),
          createdAt: new Date().toISOString(),
        };
        board[column].push(card);
        await env.RITUAL_KV.put('board', JSON.stringify(board));
        return new Response(JSON.stringify(card), { headers });
      }

      if (path.startsWith('/api/board/card/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        const data = await env.RITUAL_KV.get('board');
        const board = data
          ? JSON.parse(data)
          : { rose: [], bud: [], thorn: [] };
        for (const col of ['rose', 'bud', 'thorn']) {
          board[col] = board[col].filter((c) => c.id !== id);
        }
        await env.RITUAL_KV.put('board', JSON.stringify(board));
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      if (path === '/api/board' && request.method === 'DELETE') {
        await env.RITUAL_KV.put(
          'board',
          JSON.stringify({ rose: [], bud: [], thorn: [] })
        );
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // ── Timer ──────────────────────────────────────────────────────────────

      if (path === '/api/timer' && request.method === 'GET') {
        const data = await env.RITUAL_KV.get('timer');
        const timer = data
          ? JSON.parse(data)
          : { running: false, startedAt: null, duration: 300 };
        return new Response(JSON.stringify(timer), { headers });
      }

      if (path === '/api/timer/start' && request.method === 'POST') {
        const { duration } = await request.json();
        const timer = {
          running: true,
          startedAt: Date.now(),
          duration: Math.max(60, Math.min(3600, duration || 300)),
        };
        await env.RITUAL_KV.put('timer', JSON.stringify(timer));
        return new Response(JSON.stringify(timer), { headers });
      }

      if (path === '/api/timer/reset' && request.method === 'POST') {
        const { duration } = await request.json();
        const data = await env.RITUAL_KV.get('timer');
        const current = data ? JSON.parse(data) : { duration: 300 };
        const timer = {
          running: false,
          startedAt: null,
          duration: duration ?? current.duration,
        };
        await env.RITUAL_KV.put('timer', JSON.stringify(timer));
        return new Response(JSON.stringify(timer), { headers });
      }

      // ── Synthesize ─────────────────────────────────────────────────────────

      if (path === '/api/synthesize' && request.method === 'POST') {
        const { board } = await request.json();

        const fmt = (cards) =>
          cards.length
            ? cards.map((c) => `• ${c.text}`).join('\n')
            : '(none)';

        const prompt = `You are a team retrospective facilitator. Analyze this Rose Bud Thorn board.

ROSES (what went well):
${fmt(board.rose)}

BUDS (opportunities):
${fmt(board.bud)}

THORNS (challenges):
${fmt(board.thorn)}

Respond with ONLY valid JSON in this exact format, no other text:
{"themes":["short theme 1","short theme 2","short theme 3"],"actionItems":["action 1","action 2","action 3"]}

Keep themes to 4–6 words. Make action items specific and actionable. Include 3–5 items in each array.`;

        try {
          const result = await env.AI.run(
            '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            {
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a concise team facilitator. Always respond with valid JSON only.',
                },
                { role: 'user', content: prompt },
              ],
              max_tokens: 600,
            }
          );

          const text = result.response ?? '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify(parsed), { headers });
          }
          throw new Error('No JSON in response');
        } catch (e) {
          return new Response(
            JSON.stringify({ error: `AI synthesis failed: ${e.message}` }),
            { status: 500, headers }
          );
        }
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
