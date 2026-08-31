const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  age: z.coerce.number().int().min(13).max(120).optional(),
  gender: z.string().optional(),
  goals: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
