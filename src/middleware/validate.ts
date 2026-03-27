/**
 * JSON Schema definitions for request body validation.
 * Fastify uses these natively via AJV.
 */

export const checkSchema = {
  type: 'object',
  required: ['clientId'],
  properties: {
    clientId: { type: 'string', minLength: 1 },
    inlineConfig: {
      type: 'object',
      required: ['algorithm', 'limit', 'windowMs'],
      properties: {
        algorithm: { type: 'string', enum: ['fixed-window', 'sliding-window', 'token-bucket'] },
        limit: { type: 'integer', minimum: 1 },
        windowMs: { type: 'integer', minimum: 1000 },
        refillRate: { type: 'number', minimum: 0.1 },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export const createClientSchema = {
  type: 'object',
  required: ['clientId', 'algorithm', 'limit', 'windowMs'],
  properties: {
    clientId: { type: 'string', minLength: 1 },
    algorithm: {
      type: 'string',
      enum: ['fixed-window', 'sliding-window', 'token-bucket'],
    },
    limit: { type: 'integer', minimum: 1 },
    windowMs: { type: 'integer', minimum: 1000 },
    refillRate: { type: 'number', minimum: 0.1 },
  },
  additionalProperties: false,
} as const;
