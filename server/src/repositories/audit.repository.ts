import { prisma } from '../database/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateAuditEventInput {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditRepository {
  async create(input: CreateAuditEventInput) {
    try {
      return await prisma.auditEvent.create({
        data: {
          userId: input.userId || null,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId || null,
          metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: input.ipAddress || null,
        },
      });
    } catch (err) {
      // Don't crash main request if audit logging fails
      console.error('Failed to create audit event:', err);
      return null;
    }
  }
}

export const auditRepository = new AuditRepository();

