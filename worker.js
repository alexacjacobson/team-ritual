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
        const { column, text, name } = await request.json();
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
          name: (name || '').trim(),
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
        const { rose, bud, thorn } = await request.json();

        const fmt = (cards) =>
          cards.length
            ? cards.map((c) => `- ${c.text}`).join('\n')
            : '(none)';

        const userMessage = `Here are the retro cards:

ROSES (what's working):
${fmt(rose)}

BUDS (opportunities):
${fmt(bud)}

THORNS (what's painful):
${fmt(thorn)}

Synthesize these into themes and action items.`;

        try {
          const result = await env.AI.run(
            '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            {
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a skilled facilitator helping a design team synthesize a Rose/Bud/Thorn retrospective. Rose = what\'s working well. Bud = opportunities or things with potential. Thorn = what\'s painful or not working. Your job is to read all the cards, identify 2-3 named themes that cut across the columns, and suggest 3-5 concrete, specific action items the team can commit to. Ground your response in what\'s actually on the board — do not give generic advice. Return ONLY valid JSON in this exact format with no other text: { "themes": ["theme 1", "theme 2"], "actionItems": ["action 1", "action 2", "action 3"] }',
                },
                { role: 'user', content: userMessage },
              ],
            }
          );

          const response = result.response;
          if (
            response &&
            typeof response === 'object' &&
            response.themes &&
            response.actionItems
          ) {
            return new Response(JSON.stringify(response), { headers });
          }
          const text = typeof response === 'string' ? response : JSON.stringify(response ?? '');
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

      // ── Reflection Prompts ─────────────────────────────────────────────────

      if (path === '/api/reflection-prompts' && request.method === 'POST') {
        const { rose, bud, thorn } = await request.json();

        const fmt = (cards) =>
          cards.length
            ? cards.map((c) => `- ${c.text}`).join('\n')
            : '(none)';

        const userMessage = `Here are the retro cards:

ROSES (what's working):
${fmt(rose)}

BUDS (opportunities):
${fmt(bud)}

THORNS (what's painful):
${fmt(thorn)}

Generate reflection questions for the facilitator.`;

        try {
          const result = await env.AI.run(
            '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            {
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a retrospective facilitator. Generate exactly 3 short reflection prompts for each of the three Rose/Bud/Thorn categories to help team members think before writing their cards. Rose prompts should help surface wins and positive moments. Bud prompts should help identify opportunities and potential. Thorn prompts should help surface blockers and frustrations. Each prompt should be one concise question under 20 words. Return ONLY valid JSON with keys rose, bud, thorn, each containing an array of 3 strings.',
                },
                { role: 'user', content: userMessage },
              ],
            }
          );

          const response = result.response;
          if (response && typeof response === 'object' && response.rose) {
            return new Response(JSON.stringify(response), { headers });
          }
          const text = typeof response === 'string' ? response : JSON.stringify(response ?? '');
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify(parsed), { headers });
          }
          throw new Error('No JSON in response');
        } catch (e) {
          return new Response(
            JSON.stringify({ error: `AI prompt generation failed: ${e.message}` }),
            { status: 500, headers }
          );
        }
      }

      // ── Rituals ────────────────────────────────────────────────────────────

      if (path === '/api/rituals' && request.method === 'GET') {
        const data = await env.RITUAL_KV.get('rituals');
        const rituals = data ? JSON.parse(data) : [];
        return new Response(JSON.stringify(rituals), { headers });
      }

      if (path === '/api/rituals' && request.method === 'POST') {
        const { board, synthesis } = await request.json();
        const data = await env.RITUAL_KV.get('rituals');
        const rituals = data ? JSON.parse(data) : [];
        const ritual = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          savedAt: new Date().toISOString(),
          board,
          synthesis,
        };
        rituals.unshift(ritual);
        await env.RITUAL_KV.put('rituals', JSON.stringify(rituals));
        return new Response(JSON.stringify(ritual), { headers });
      }

      if (path.startsWith('/api/rituals/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        const data = await env.RITUAL_KV.get('rituals');
        const rituals = data ? JSON.parse(data) : [];
        const filtered = rituals.filter((r) => r.id !== id);
        await env.RITUAL_KV.put('rituals', JSON.stringify(filtered));
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
