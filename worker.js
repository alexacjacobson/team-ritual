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
              max_tokens: 1024,
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a skilled facilitator helping a design team synthesize a Rose/Bud/Thorn retrospective. Rose = what\'s working well. Bud = opportunities or things with potential. Thorn = what\'s painful or not working. First, write one short creative title for this retrospective session — 3 to 6 words, capturing the main theme or feeling of the week in an evocative but not cheesy way (think: a chapter title, not a corporate headline). Then identify 2-3 named themes that cut across the columns. For each theme, write one concise sentence explaining why it emerged, referencing the actual pattern in the cards without quoting verbatim. Then suggest 3-5 concrete action items. For each action item, assess its priority as "high" if it directly addresses a Thorn or a recurring pattern across multiple cards, or "normal" otherwise. Ground everything in what\'s actually on the board — do not give generic advice. Return ONLY valid JSON in this exact format with no other text: { "title": "creative session title", "themes": [{ "name": "theme name", "description": "one sentence explaining why this theme emerged" }], "actionItems": [{ "text": "action item text", "priority": "high" or "normal" }] }',
                },
                { role: 'user', content: userMessage },
              ],
            }
          );

          const response = result.response;
          console.log('[synthesize] raw AI response:', JSON.stringify(response));

          // Fast path: Workers AI already parsed the JSON into an object.
          if (
            response &&
            typeof response === 'object' &&
            response.themes &&
            response.actionItems
          ) {
            return new Response(JSON.stringify(response), { headers });
          }

          // Slow path: response is a string — extract and parse JSON from it.
          const text = typeof response === 'string' ? response : JSON.stringify(response ?? '');

          // Try the full greedy match first, then fall back to first-{/last-} slice
          // to handle cases where the model emits trailing text after the closing brace.
          const tryParse = (str) => {
            try { return JSON.parse(str); } catch (_) { return null; }
          };

          const greedyMatch = text.match(/\{[\s\S]*\}/);
          let parsed = greedyMatch ? tryParse(greedyMatch[0]) : null;

          if (!parsed) {
            // Fallback: slice from first { to last } and retry.
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end > start) {
              parsed = tryParse(text.slice(start, end + 1));
            }
          }

          if (parsed && parsed.themes && parsed.actionItems) {
            return new Response(JSON.stringify(parsed), { headers });
          }

          throw new Error('Could not extract valid JSON from AI response');
        } catch (e) {
          console.error('[synthesize] error:', e.message);
          return new Response(
            JSON.stringify({ error: 'Synthesis failed, please try again.' }),
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

        const angles = [
          "team dynamics and how people worked together",
          "process and how work actually flowed",
          "communication and information sharing",
          "individual growth and what people learned",
          "outcomes and what got delivered",
          "decision-making and how choices were made"
        ];
        const angle = angles[Math.floor(Math.random() * angles.length)];

        const userMessage = `Here are the retro cards:

ROSES (what's working):
${fmt(rose)}

BUDS (opportunities):
${fmt(bud)}

THORNS (what's painful):
${fmt(thorn)}

Generate reflection questions for the facilitator. For this round, lean into the angle of ${angle} when crafting your prompts, while still following the Rose/Bud/Thorn and GROW framing from your instructions.`;

        try {
          const result = await env.AI.run(
            '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            {
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a retrospective facilitator trained in the Rose/Bud/Thorn framework and the GROW coaching model. Your guiding principles:\n\nRose/Bud/Thorn framework: Rose = what\'s working well and should be celebrated. Bud = an opportunity or early-stage idea with potential. Thorn = what\'s painful, blocked, or needs attention — not a complaint, but a signal for where the team can grow.\n\nGROW model influence: Good reflection prompts mirror the GROW structure — Goal (what were we aiming for), Reality (what actually happened), Options (what could change), Will (what will we commit to). Let this structure inform the angle of your questions even though you are not running a full GROW session.\n\nMultiplier principle: The best facilitators ask questions that amplify the team\'s own thinking rather than supplying answers. Prompts should open reflection, not lead to a single \'correct\' response.\n\nGenerate exactly 3 reflection prompts for each of the three Rose/Bud/Thorn categories to help team members think before writing their cards:\n- Rose prompts surface genuine wins, using a Reality-oriented lens (what actually happened that felt good)\n- Bud prompts surface potential, using an Options-oriented lens (what could we explore or try)\n- Thorn prompts surface blockers, using a Goal-gap lens (where did reality diverge from what we aimed for)\n\nEach prompt should be one concise, open-ended question under 20 words. Vary your phrasing and angle across requests — draw from team dynamics, process, communication, individual growth, and outcomes so prompts don\'t feel repetitive. Return ONLY valid JSON with keys rose, bud, thorn, each containing an array of 3 strings.',
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
