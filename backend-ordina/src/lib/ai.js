const { detectConflicts, findOpenSlot, recommendNow, overwhelmPlan, durationMinutes, toDateKey, addDays } = require('./schedule');

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

function parseJsonText(text) {
  const trimmed = String(text || '{}').replace(/```json|```/g, '').trim();
  return JSON.parse(trimmed);
}

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
    return parseJsonText(text);
  } catch {
    const error = new Error('ORDINA returned invalid structured output');
    error.status = 502;
    throw error;
  }
}

function nextWeekday(from, weekday, timeZone) {
  const date = new Date(from);
  const current = date.getDay();
  let delta = (weekday - current + 7) % 7;
  if (delta === 0) delta = 7;
  date.setDate(date.getDate() + delta);
  return toDateKey(date, timeZone);
}

function resolveDate(text, now, timeZone) {
  const lower = text.toLowerCase();
  if (/\btomorrow\b/.test(lower)) return addDays(toDateKey(now, timeZone), 1);
  if (/\btoday\b/.test(lower)) return toDateKey(now, timeZone);
  if (/\bnext monday\b/.test(lower)) return nextWeekday(now, 1, timeZone);
  if (/\bnext tuesday\b/.test(lower)) return nextWeekday(now, 2, timeZone);
  if (/\bnext wednesday\b/.test(lower)) return nextWeekday(now, 3, timeZone);
  if (/\bnext thursday\b/.test(lower)) return nextWeekday(now, 4, timeZone);
  if (/\bnext friday\b/.test(lower)) return nextWeekday(now, 5, timeZone);
  const iso = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  return toDateKey(now, timeZone);
}

function resolvePeriodTime(text) {
  const lower = text.toLowerCase();
  if (/\bmorning\b/.test(lower)) return '09:00';
  if (/\bafternoon\b/.test(lower)) return '14:00';
  if (/\bevening\b/.test(lower)) return '18:00';
  if (/\bnight\b/.test(lower)) return '20:00';
  return undefined;
}

function parseClock(text) {
  const timeMatch = String(text).match(/(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    || String(text).match(/\b(\d{1,2})(?::(\d{2}))\s*(am|pm)\b/i)
    || String(text).match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (!timeMatch) return resolvePeriodTime(text);
  let hour = Number(timeMatch[1]);
  const minute = timeMatch[2] || '00';
  const period = (timeMatch[3] || timeMatch[timeMatch.length - 1] || '').toLowerCase();
  if (period === 'pm' && hour < 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  if (!period && hour <= 7) hour += 12;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function parseDuration(text) {
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  const durationMatch = String(text).match(/(?:for|of)\s+(\d+|one|two|three|four|five|six|seven|eight)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/i)
    || String(text).match(/\b(\d+|one|two|three|four|five|six|seven|eight)\s*(hour|hours|hr|hrs)\b/i);
  if (!durationMatch) return 60;
  const amount = words[durationMatch[1].toLowerCase()] || Number(durationMatch[1]);
  return /hour|hr/i.test(durationMatch[2]) ? amount * 60 : amount;
}

function cleanTitle(text) {
  return String(text)
    .replace(/\b(please|i need to|i want to|i have to|remind me to|remind me|create a task to|create task to|add a task to|schedule|tomorrow|today|this (morning|afternoon|evening)|next (monday|tuesday|wednesday|thursday|friday)|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|for\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)|in the (morning|afternoon|evening))\b/gi, '')
    .replace(/^i need to\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.:;\s]+|[,.:;\s]+$/g, '') || String(text).trim();
}

function splitActivities(message) {
  let body = String(message || '').trim();
  body = body.replace(/^(tomorrow|today|next \w+|this (morning|afternoon|evening))\s*[:\-]\s*/i, '');
  body = body.replace(/^(i need to|i want to|please)\s+/i, '');
  return body
    .split(/\n+|;\s*|\s+and\s+|,\s+(?=[a-z])/i)
    .map((part) => part.replace(/^[-*•\d.)]+\s*/, '').replace(/^and\s+/i, '').trim())
    .filter((part) => part.length > 2 && !/^(tomorrow|today|please)$/i.test(part));
}

function localTaskFromInstruction(message, now, timeZone) {
  const date = resolveDate(message, now, timeZone);
  const startTime = parseClock(message);
  const durationMinutesValue = parseDuration(message);
  const lower = String(message).toLowerCase();
  const priority = lower.includes('high priority') || lower.includes('urgent') ? 'high' : lower.includes('low priority') ? 'low' : 'medium';
  const title = cleanTitle(message);
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    date,
    startTime,
    durationMinutes: durationMinutesValue,
    priority,
    reminder: /\bremind/.test(lower),
  };
}

function matchExistingTask(existingTasks, hint) {
  const needle = String(hint || '').toLowerCase().trim();
  if (!needle) return null;
  return (existingTasks || []).find((task) => !task.completed && String(task.title || '').toLowerCase().includes(needle))
    || (existingTasks || []).find((task) => String(task.title || '').toLowerCase().includes(needle));
}

function localReschedule(message, existingTasks, now, timeZone) {
  const lower = String(message).toLowerCase();
  if (!/\b(move|reschedule|postpone|push)\b/.test(lower)) return null;
  const hintMatch = lower.match(/\b(?:move|reschedule|postpone|push)\s+(?:my\s+)?(.+?)\s+to\b/i);
  const titleHint = (hintMatch?.[1] || '').replace(/\b(the|a|an)\b/g, '').trim();
  const matched = matchExistingTask(existingTasks, titleHint);
  if (!matched) {
    return {
      intent: 'clarify',
      message: `I could not find a task matching “${titleHint || 'that'}”. Name the task you want to move.`,
      tasks: [],
      clarification: 'Tell me the task title and the new day or time.',
    };
  }
  const date = resolveDate(message, now, timeZone);
  const startTime = parseClock(message) || matched.startTime || findOpenSlot(existingTasks, date, durationMinutes(matched.duration));
  return applyScheduleGuards({
    intent: 'reschedule',
    message: `Move “${matched.title}” to ${date}${startTime ? ` at ${startTime}` : ''}. Confirm to save.`,
    tasks: [],
    reschedule: { taskId: matched.id, titleHint: matched.title, date, startTime },
  }, existingTasks);
}

function localInterpret(message, existingTasks, timeZone) {
  const now = new Date();
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
        date: task.dueDate || addDays(toDateKey(now, timeZone), index + 1),
        startTime: task.startTime || findOpenSlot(existingTasks || [], task.dueDate || addDays(toDateKey(now, timeZone), index + 1), durationMinutes(task.duration)),
        durationMinutes: durationMinutes(task.duration),
        priority: typeof task.priority === 'number' ? (task.priority >= 3 ? 'high' : task.priority === 2 ? 'medium' : 'low') : task.priority || 'medium',
        reminder: Boolean(task.reminder),
      })),
    };
  }
  if (/\b(hello|hi|help|what can you do|capabilities)\b/.test(lower) && splitActivities(message).length <= 1) {
    return {
      intent: 'clarify',
      message: 'I can create tasks, organize your week, find your next priority, explain an overwhelmed plan, and suggest a new time when tasks conflict.',
      tasks: [],
      clarification: 'Tell me the activity, date, time, duration, or priority you want to organize.',
    };
  }
  const reschedule = localReschedule(message, existingTasks, now, timeZone);
  if (reschedule) return reschedule;

  const sharedDate = resolveDate(message, now, timeZone);
  const parts = splitActivities(message);
  const tasks = (parts.length ? parts : [message]).map((part) => {
    const task = localTaskFromInstruction(part, now, timeZone);
    if (!/\b(today|tomorrow|next )\b/i.test(part)) task.date = sharedDate;
    return task;
  });
  const unique = [];
  for (const task of tasks) {
    if (!unique.some((item) => item.title.toLowerCase() === task.title.toLowerCase())) unique.push(task);
  }
  return applyScheduleGuards({
    intent: unique.length > 1 ? 'create_tasks' : 'create_tasks',
    message: unique.length > 1
      ? `I found ${unique.length} activities. Review them before saving.`
      : `I understood your request as “${unique[0]?.title}”${unique[0]?.date ? ` for ${unique[0].date}` : ''}${unique[0]?.startTime ? ` at ${unique[0].startTime}` : ''}. Review it before saving.`,
    tasks: unique,
  }, existingTasks || []);
}

function applyScheduleGuards(parsed, existing) {
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const scheduled = [...(existing || [])];
  const guarded = tasks.map((task) => {
    const durationMinutesValue = Number(task.durationMinutes) || 60;
    const conflicts = detectConflicts(scheduled, {
      dueDate: task.date,
      startTime: task.startTime,
      durationMinutes: durationMinutesValue,
    });
    let startTime = task.startTime;
    let conflictsWith;
    let suggestedStartTime;
    if (conflicts.length && startTime) {
      const slot = findOpenSlot(scheduled, task.date, durationMinutesValue);
      suggestedStartTime = slot;
      conflictsWith = conflicts.map((item) => item.title);
      startTime = slot;
    } else if (!startTime && task.date) {
      startTime = findOpenSlot(scheduled, task.date, durationMinutesValue);
    }
    const next = { ...task, durationMinutes: durationMinutesValue, startTime, suggestedStartTime, conflictsWith };
    scheduled.push({
      title: next.title,
      dueDate: next.date,
      startTime: next.startTime,
      duration: `${Math.round(durationMinutesValue / 60)}h ${durationMinutesValue % 60}m`,
      completed: false,
    });
    return next;
  });
  const hasConflict = guarded.some((task) => task.conflictsWith?.length);
  const conflictNote = hasConflict
    ? guarded
      .filter((task) => task.conflictsWith?.length)
      .map((task) => `${task.conflictsWith.join(', ')} conflicted with the requested time; proposed ${task.startTime}`)
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
  const today = toDateKey(new Date(), timezone);
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
  if (!process.env.GEMINI_API_KEY) return localInterpret(message, existingTasks, timezone);
  try {
    const parsed = await callGemini([
      {
        role: 'user',
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n${JSON.stringify({
            today,
            timezone: timezone || 'UTC',
            instruction: message,
            existingTasks: (existingTasks || []).slice(0, 80),
            matchingContacts: (contacts || []).slice(0, 8),
          })}`,
        }],
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
  } catch (error) {
    const fallback = localInterpret(message, existingTasks, timezone);
    fallback.message = `${fallback.message} Gemini was unavailable, so ORDINA used its built-in planner.`;
    fallback.fallback = true;
    return fallback;
  }
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

module.exports = { interpret, transcribe, durationMinutes, localInterpret };
