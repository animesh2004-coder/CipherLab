import { prisma } from '../database/prisma.js';
import { logger } from '../observability/logger.js';

/**
 * Background maintenance jobs for CipherLab production platform.
 * Prunes expired idempotency keys and enforces audit event retention.
 */
export class MaintenanceJobs {
  /**
   * Deletes expired idempotency keys whose validity window has passed.
   */
  async cleanupExpiredIdempotencyKeys(): Promise<number> {
    try {
      const result = await prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        logger.info(
          { deletedCount: result.count },
          'Cleaned up expired idempotency keys'
        );
      }
      return result.count;
    } catch (err) {
      logger.error({ err }, 'Failed to cleanup expired idempotency keys');
      return 0;
    }
  }

  /**
   * Prunes audit events older than the specified retention window (default: 90 days).
   */
  async cleanupOldAuditEvents(retentionDays = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.auditEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (result.count > 0) {
        logger.info(
          { deletedCount: result.count, retentionDays },
          'Cleaned up old audit events'
        );
      }
      return result.count;
    } catch (err) {
      logger.error({ err }, 'Failed to cleanup old audit events');
      return 0;
    }
  }

  /**
   * Starts periodic maintenance job runner (e.g. hourly).
   */
  startScheduled(intervalMs = 60 * 60 * 1000): NodeJS.Timeout {
    logger.info({ intervalMs }, 'Starting periodic maintenance cleanup scheduler');
    return setInterval(async () => {
      await this.cleanupExpiredIdempotencyKeys();
      await this.cleanupOldAuditEvents();
    }, intervalMs);
  }
}

export const maintenanceJobs = new MaintenanceJobs();

