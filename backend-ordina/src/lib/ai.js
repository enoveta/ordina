const { detectConflicts, findOpenSlot, recommendNow, overwhelmPlan, durationMinutes, toDateKey } = require('./schedule');

const SYSTEM_PROMPT = `You are ORDINA, an action-oriented personal productivity assistant.
Return ONLY valid JSON with this shape:
{
  "intent": "create_tasks" | "reschedule" | "recommend_now" | "overwhelm" | "clarify" | "conflict",
  "message": "short user-facing summary",
  "tasks": [{ "title": "", "description": "", "date": "YYYY-MM-DD", "startTime": "HH:MM", "durationMinutes": 60, "priority": "low|medium|high", "reminder": false, "projectName": "", "category": "work|personal|health|learning" }],
  "reschedule": { "taskId": "", "titleHint": "", "date": "YYYY-MM-DD", "startTime": "HH:MM" },
  "clarification": ""
}
Rules:
- Extract EVERY activity in the instruction as a separate task.
- Resolve relative dates using today and timezone.
- If a requested time conflicts with existingTasks, set intent to conflict and propose a different startTime.
- For reschedule, identify the best matching existing task id from existingTasks.
- Never invent other users' data.
- If the request is unclear, intent=clarify.`;

async function callOpenAi(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const error = new Error('ORDINA AI is not configured. Set OPENAI_API_KEY in backend-ordina/.env');
    error.status = 503;
    throw error;
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages,
    }),
  });
  if (!response.ok) {
    const error = new Error('ORDINA AI could not complete that request');
    error.status = 502;
    throw error;
  }
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error('ORDINA returned invalid structured output');
    error.status = 502;
    throw error;
  }
}

function applyScheduleGuards(parsed, existing) {
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const guarded = tasks.map((task) => {
    const durationMinutesValue = Number(task.durationMinutes) || 60;
    const conflicts = detectConflicts(existing, {
      dueDate: task.date,
      startTime: task.startTime,
      durationMinutes: durationMinutesValue,
    });
    if (conflicts.length && task.startTime) {
      const avoid = task.startTime;
      const slot = findOpenSlot(existing, task.date, durationMinutesValue);
      return {
        ...task,
        durationMinutes: durationMinutesValue,
        suggestedStartTime: slot,
        conflictsWith: conflicts.map((item) => item.title),
        startTime: slot === avoid ? findOpenSlot(existing, task.date, durationMinutesValue, 14 * 60) : slot,
      };
    }
    if (!task.startTime && task.date) {
      return {
        ...task,
        durationMinutes: durationMinutesValue,
        startTime: findOpenSlot(existing, task.date, durationMinutesValue),
      };
    }
    return { ...task, durationMinutes: durationMinutesValue };
  });
  const hasConflict = guarded.some((task) => task.conflictsWith?.length);
  const conflictNote = hasConflict
    ? guarded
        .filter((task) => task.conflictsWith?.length)
        .map((task) => `${task.startTime} was busy (${task.conflictsWith.join(', ')}); proposed ${task.startTime}`)
        .join(' ')
    : parsed.message;
  return {
    ...parsed,
    message: hasConflict ? conflictNote : parsed.message,
    intent: hasConflict ? 'conflict' : parsed.intent || (guarded.length ? 'create_tasks' : parsed.intent),
    tasks: guarded,
  };
}

async function interpret({ message, timezone, existingTasks, contacts }) {
  const today = toDateKey(new Date());
  const lower = String(message || '').toLowerCase();
  if (/what should i do now/.test(lower)) {
    const task = recommendNow(existingTasks || []);
    return {
      intent: 'recommend_now',
      message: task ? `Do this next: ${task.title}` : 'You have no open tasks right now.',
      recommendation: task,
      tasks: [],
    };
  }
  if (/overwhelmed/.test(lower)) {
    return {
      intent: 'overwhelm',
      message: 'Here is a calmer plan for what matters now.',
      plan: overwhelmPlan(existingTasks || []),
      tasks: [],
    };
  }
  const parsed = await callOpenAi([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        today,
        timezone: timezone || 'UTC',
        instruction: message,
        existingTasks: (existingTasks || []).slice(0, 80),
        matchingContacts: (contacts || []).slice(0, 8),
      }),
    },
  ]);

  if (parsed.intent === 'recommend_now') {
    const task = recommendNow(existingTasks || []);
    return {
      intent: 'recommend_now',
      message: task ? `Do this next: ${task.title}` : 'You have no open tasks right now.',
      recommendation: task,
      tasks: [],
    };
  }
  if (parsed.intent === 'overwhelm') {
    const plan = overwhelmPlan(existingTasks || []);
    return {
      intent: 'overwhelm',
      message: 'Here is a calmer plan for what matters now.',
      plan,
      tasks: [],
    };
  }
  return applyScheduleGuards(parsed, existingTasks || []);
}

async function transcribe(base64Audio, mimeType) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const error = new Error('ORDINA AI is not configured. Set OPENAI_API_KEY in backend-ordina/.env');
    error.status = 503;
    throw error;
  }
  if (!base64Audio) {
    const error = new Error('Audio is required');
    error.status = 400;
    throw error;
  }
  const buffer = Buffer.from(base64Audio, 'base64');
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType || 'audio/m4a' });
  form.append('file', blob, 'speech.m4a');
  form.append('model', 'whisper-1');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!response.ok) {
    const error = new Error('Speech could not be transcribed');
    error.status = 502;
    throw error;
  }
  const payload = await response.json();
  return String(payload.text || '').trim();
}

module.exports = { interpret, transcribe, durationMinutes };
