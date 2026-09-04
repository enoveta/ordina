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

async function callGemini(contents, responseMimeType = 'application/json') {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const error = new Error('ORDINA AI is not configured. Set GEMINI_API_KEY in backend-ordina/.env');
    error.status = 503;
    throw error;
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.2, responseMimeType },
    }),
  });
  if (!response.ok) {
    const error = new Error('ORDINA AI could not complete that Gemini request');
    error.status = 502;
    throw error;
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{}';
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error('ORDINA returned invalid structured output');
    error.status = 502;
    throw error;
  }
}

function localTaskFromInstruction(message) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();
  const today = new Date();
  const date = lower.includes('tomorrow') ? toDateKey(new Date(today.getTime() + 86400000)) : toDateKey(today);
  const timeMatch = lower.match(/(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let startTime;
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = timeMatch[2] || '00';
    const period = timeMatch[3]?.toLowerCase();
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    startTime = `${String(hour).padStart(2, '0')}:${minute}`;
  }
  const durationMatch = lower.match(/(?:for|of)\s+(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/i);
  const durationMinutesValue = durationMatch
    ? /hour|hr/i.test(durationMatch[2]) ? Number(durationMatch[1]) * 60 : Number(durationMatch[1])
    : 60;
  const priority = lower.includes('high priority') || lower.includes('urgent') ? 'high' : lower.includes('low priority') ? 'low' : 'medium';
  const title = text
    .replace(/\b(please|remind me to|remind me|create a task to|create task to|add a task to|schedule|tomorrow|today|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|for\s+\d+\s*(?:hours?|hrs?|minutes?|mins?))\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.:;\s]+|[,.:;\s]+$/g, '') || text;
  return { title: title.charAt(0).toUpperCase() + title.slice(1), date, startTime, durationMinutes: durationMinutesValue, priority, reminder: lower.includes('remind') };
}

function localInterpret(message, existingTasks) {
  const lower = String(message || '').toLowerCase();
  if (/\b(plan|organize)\s+(my|the)\s+week\b/.test(lower)) {
    const open = (existingTasks || []).filter((task) => !task.completed && task.status !== 'archived').slice(0, 7);
    return {
      intent: 'create_tasks',
      message: open.length
        ? `I found ${open.length} open task${open.length === 1 ? '' : 's'} to organize. Review the proposed schedule before saving.`
        : 'You have no open tasks to organize this week. Tell me what you want to plan.',
      tasks: open.map((task, index) => ({
        title: task.title,
        description: task.description || '',
        date: task.dueDate || toDateKey(new Date(Date.now() + (index + 1) * 86400000)),
        startTime: task.startTime || findOpenSlot(existingTasks || [], task.dueDate || toDateKey(new Date(Date.now() + (index + 1) * 86400000)), durationMinutes(task.duration)),
        durationMinutes: durationMinutes(task.duration),
        priority: typeof task.priority === 'number' ? (task.priority >= 3 ? 'high' : task.priority === 2 ? 'medium' : 'low') : task.priority || 'medium',
        reminder: Boolean(task.reminder),
      })),
    };
  }
  if (/\b(hello|hi|help|what can you do|capabilities)\b/.test(lower)) {
    return {
      intent: 'clarify',
      message: 'I can create tasks, organize your week, find your next priority, explain an overwhelmed plan, and suggest a new time when tasks conflict.',
      tasks: [],
      clarification: 'Tell me the activity, date, time, duration, or priority you want to organize.',
    };
  }
  const task = localTaskFromInstruction(message);
  return applyScheduleGuards({
    intent: 'create_tasks',
    message: `I understood your request as “${task.title}”${task.date ? ` for ${task.date}` : ''}${task.startTime ? ` at ${task.startTime}` : ''}. Review it before saving.`,
    tasks: [task],
  }, existingTasks || []);
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
  if (!process.env.GEMINI_API_KEY) return localInterpret(message, existingTasks);
  const parsed = await callGemini([
    {
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${JSON.stringify({
        today,
        timezone: timezone || 'UTC',
        instruction: message,
        existingTasks: (existingTasks || []).slice(0, 80),
        matchingContacts: (contacts || []).slice(0, 8),
      })}` }],
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
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const error = new Error('ORDINA voice AI is not configured. Set GEMINI_API_KEY in backend-ordina/.env');
    error.status = 503;
    throw error;
  }
  if (!base64Audio) {
    const error = new Error('Audio is required');
    error.status = 400;
    throw error;
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Transcribe this audio exactly. Return only the spoken words.' },
          { inlineData: { mimeType: mimeType || 'audio/m4a', data: base64Audio } },
        ],
      }],
    }),
  });
  if (!response.ok) {
    const error = new Error('Speech could not be transcribed by Gemini');
    error.status = 502;
    throw error;
  }
  const payload = await response.json();
  return String(payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '').trim();
}

module.exports = { interpret, transcribe, durationMinutes };
