const { env } = require('../config/env');

async function chat(message) {
  const text = String(message || '').trim();
  if (!text) {
    const error = new Error('Message is required');
    error.status = 400;
    throw error;
  }
  if (!env.openaiApiKey) {
    const error = new Error(
      'ORDINA AI is not configured yet. Set OPENAI_API_KEY in backend-ordina/.env to enable replies.'
    );
    error.status = 503;
    throw error;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are ORDINA, a calm personal productivity assistant. Help the user put their day in order. Keep replies short.',
        },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!response.ok) {
    const error = new Error('ORDINA AI could not complete that request');
    error.status = 502;
    throw error;
  }

  const payload = await response.json();
  return {
    reply: payload.choices?.[0]?.message?.content || 'I am here when you are ready.',
  };
}

module.exports = { chat };
