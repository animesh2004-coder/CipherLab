import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase alphanumeric characters and hyphens'),
});

export const quizSubmissionSchema = z.object({
  idempotencyKey: z
    .string()
    .uuid('idempotencyKey must be a valid UUIDv4')
    .or(z.string().min(16).max(128)),
  answers: z
    .record(z.string().min(1), z.string().min(1))
    .refine((obj) => Object.keys(obj).length > 0, {
      message: 'Answers cannot be empty',
    }),
});

export const lessonProgressUpdateSchema = z.object({
  completed: z.boolean(),
});

