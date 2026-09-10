const { env } = require('../config/env');

function localReply(message) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (/what should i do now/.test(lower)) {
    return `Tell me your open tasks or priorities and I will help you choose what to do next. Today is ${today}.`;
  }
  if (/overwhelmed|too much|stressed/.test(lower)) {
    return 'Let us make it manageable. Tell me the tasks on your mind and I will separate them into urgent, can wait, and optional.';
  }
  if (/plan my week|organize my week/.test(lower)) {
    return 'I can organize your week. Send me the activities, deadlines, preferred times, and durations you want included.';
  }
  if (/^(hi|hello|help|what can you do)\b/.test(lower)) {
    return 'I can help create tasks, plan your week, prioritize work, and break a large activity into smaller steps. What would you like to organize?';
  }
  if (/\b(create|add|make|schedule|remind)\b/.test(lower)) {
    return `I understood your request: “${text}”. Add a date, time, duration, or priority if you want me to make the plan more specific.`;
  }
  return `I received: “${text}”. Tell me whether you want me to create a task, plan your time, prioritize tasks, or help with an overwhelming list.`;
}

async function chat(message) {
  const text = String(message || '').trim();
  if (!text) {
    const error = new Error('Message is required');
    error.status = 400;
    throw error;
  }
  if (!env.openaiApiKey) {
    return { reply: localReply(text), provider: 'local' };
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
    provider: 'openai',
  };
}

module.exports = { chat };
