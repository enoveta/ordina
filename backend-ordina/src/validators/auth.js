const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_]+$/, 'Username can use letters, numbers, and underscores'),
  email: z.string().email(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  name: z.string().min(1),
  age: z.coerce.number().int().min(13).max(120).optional(),
  gender: z.string().optional(),
  goals: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

function parse(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Invalid request');
    error.status = 422;
    throw error;
  }
  return result.data;
}

module.exports = { registerSchema, loginSchema, parse };
