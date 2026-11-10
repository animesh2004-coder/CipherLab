import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../observability/logger.js';
import { ApiError } from '@cipherlab/shared';

export function errorHandler(
  error: FastifyError | Error,
  req: FastifyRequest,
  reply: FastifyReply
): void {
  const requestId = req.requestId || 'unknown';

  // 1. Zod validation error
  if (error instanceof ZodError) {
    const formattedIssues = error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));

    logger.warn({
      requestId,
      issues: formattedIssues,
      url: req.url,
      method: req.method,
    }, 'Validation error');

    const response: ApiError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input. Please check the submitted fields.',
        requestId,
        details: { fields: formattedIssues },
      },
    };
    reply.status(400).send(response);
    return;
  }

  // 2. Fastify schema validation error
  if ('validation' in error && error.validation) {
    logger.warn({ requestId, err: error.message }, 'Fastify schema validation error');
    const response: ApiError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Validation error',
        requestId,
      },
    };
    reply.status(400).send(response);
    return;
  }

  // 3. Resolve status code and error code
  const statusCode =
    (error as { statusCode?: number }).statusCode ||
    (reply.statusCode && reply.statusCode >= 400 ? reply.statusCode : 500);

  let code = (error as { code?: string }).code;

  if (statusCode === 401) {
    code = 'UNAUTHORIZED';
    const response: ApiError = {
      error: {
        code,
        message: error.message || 'Authentication required.',
        requestId,
      },
    };
    reply.status(401).send(response);
    return;
  }

  if (statusCode === 403) {
    code = 'FORBIDDEN';
    const response: ApiError = {
      error: {
        code,
        message: error.message || 'Access denied.',
        requestId,
      },
    };
    reply.status(403).send(response);
    return;
  }

  if (statusCode === 404) {
    code = 'NOT_FOUND';
    const response: ApiError = {
      error: {
        code,
        message: error.message || 'Resource not found.',
        requestId,
      },
    };
    reply.status(404).send(response);
    return;
  }

  if (statusCode === 429) {
    code = 'RATE_LIMIT_EXCEEDED';
    const response: ApiError = {
      error: {
        code,
        message: 'Too many requests. Please slow down and try again later.',
        requestId,
      },
    };
    reply.status(429).send(response);
    return;
  }

  // 4. Server internal error (500)
  logger.error({
    requestId,
    err: error,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  }, 'Internal Server Error');

  const response: ApiError = {
    error: {
      code: code || 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      requestId,
    },
  };

  reply.status(500).send(response);
}

export function notFoundHandler(req: FastifyRequest, reply: FastifyReply): void {
  const requestId = req.requestId || 'unknown';
  const response: ApiError = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found.`,
      requestId,
    },
  };
  reply.status(404).send(response);
}
