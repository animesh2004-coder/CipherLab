/**
 * OpenTelemetry-compatible metrics and tracing module.
 * Provides in-process aggregation for API metrics and traces.
 */

export interface MetricSnapshot {
  timestamp: string;
  uptimeSeconds: number;
  totalRequests: number;
  activeRequests: number;
  requestsByStatus: Record<string, number>;
  requestsByRoute: Record<string, number>;
  rateLimitHits: number;
  averageLatencyMs: number;
}

class ApiMetrics {
  private startTime = Date.now();
  private totalRequests = 0;
  private activeRequests = 0;
  private requestsByStatus: Record<string, number> = {};
  private requestsByRoute: Record<string, number> = {};
  private rateLimitHits = 0;
  private totalLatencyMs = 0;

  recordRequestStart(route: string) {
    this.totalRequests++;
    this.activeRequests++;
    this.requestsByRoute[route] = (this.requestsByRoute[route] || 0) + 1;
  }

  recordRequestEnd(statusCode: number, durationMs: number) {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    const statusGroup = `${Math.floor(statusCode / 100)}xx`;
    this.requestsByStatus[statusGroup] = (this.requestsByStatus[statusGroup] || 0) + 1;
    this.totalLatencyMs += durationMs;
  }

  recordRateLimitHit() {
    this.rateLimitHits++;
  }

  getSnapshot(): MetricSnapshot {
    const avgLatency = this.totalRequests > 0 ? this.totalLatencyMs / this.totalRequests : 0;
    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      activeRequests: this.activeRequests,
      requestsByStatus: { ...this.requestsByStatus },
      requestsByRoute: { ...this.requestsByRoute },
      rateLimitHits: this.rateLimitHits,
      averageLatencyMs: Math.round(avgLatency * 100) / 100,
    };
  }
}

export const metrics = new ApiMetrics();

