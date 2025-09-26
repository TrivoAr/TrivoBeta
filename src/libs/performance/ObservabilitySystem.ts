"use client";

import React from "react";

/**
 * Metric Types
 */
export type MetricType = "counter" | "gauge" | "histogram" | "timer";

export type MetricValue = number | string | boolean;

/**
 * Metric Definition
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: MetricValue;
  timestamp: number;
  tags: Record<string, string>;
  unit?: string;
  description?: string;
}

/**
 * Performance Entry
 */
export interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  type: "navigation" | "api" | "component" | "user-action" | "system";
  metadata: Record<string, any>;
}

/**
 * Event Definition
 */
export interface ObservabilityEvent {
  name: string;
  type: "info" | "warn" | "error" | "debug" | "critical";
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
  context?: {
    url?: string;
    userAgent?: string;
    userId?: string;
    rol?: string;
  };
}

/**
 * Health Check Result
 */
export interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Observability Configuration
 */
export interface ObservabilityConfig {
  enabled: boolean;
  sampling: {
    events: number; // 0-1, percentage to sample
    metrics: number;
    performance: number;
  };
  retention: {
    events: number; // milliseconds
    metrics: number;
    performance: number;
  };
  maxEntries: {
    events: number;
    metrics: number;
    performance: number;
  };
  autoFlush: {
    enabled: boolean;
    interval: number; // milliseconds
    batchSize: number;
  };
  endpoints?: {
    metrics?: string;
    events?: string;
    performance?: string;
  };
}

/**
 * Advanced Observability System
 */
export class ObservabilitySystem {
  private config: ObservabilityConfig;
  private metrics: Map<string, Metric[]> = new Map();
  private events: ObservabilityEvent[] = [];
  private performanceEntries: PerformanceEntry[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private timers: Map<string, number> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    this.config = {
      enabled: true,
      sampling: {
        events: 1.0,
        metrics: 1.0,
        performance: 1.0,
      },
      retention: {
        events: 24 * 60 * 60 * 1000, // 24 hours
        metrics: 60 * 60 * 1000, // 1 hour
        performance: 30 * 60 * 1000, // 30 minutes
      },
      maxEntries: {
        events: 1000,
        metrics: 5000,
        performance: 1000,
      },
      autoFlush: {
        enabled: true,
        interval: 60 * 1000, // 1 minute
        batchSize: 100,
      },
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.startAutoFlush();
    this.initializePerformanceObserver();
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: MetricValue,
    type: MetricType = "gauge",
    tags: Record<string, string> = {},
    unit?: string,
    description?: string
  ): void {
    if (!this.config.enabled || !this.shouldSample("metrics")) return;

    const metric: Metric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      tags: { ...tags, sessionId: this.sessionId },
      unit,
      description,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push(metric);

    // Enforce max entries
    if (metricList.length > this.config.maxEntries.metrics) {
      metricList.splice(0, metricList.length - this.config.maxEntries.metrics);
    }

    this.cleanup("metrics");
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    name: string,
    value = 1,
    tags: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, "counter", tags);
  }

  /**
   * Set a gauge metric
   */
  setGauge(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, "gauge", tags);
  }

  /**
   * Record a histogram metric
   */
  recordHistogram(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, "histogram", tags);
  }

  /**
   * Start a timer
   */
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * Stop a timer and record the duration
   */
  stopTimer(name: string, tags: Record<string, string> = {}): number {
    const startTime = this.timers.get(name);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    this.recordMetric(name, duration, "timer", tags, "ms");

    return duration;
  }

  /**
   * Record an event
   */
  recordEvent(
    name: string,
    type: ObservabilityEvent["type"] = "info",
    metadata: Record<string, any> = {},
    context?: ObservabilityEvent["context"]
  ): void {
    if (!this.config.enabled || !this.shouldSample("events")) return;

    const event: ObservabilityEvent = {
      name,
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata,
      context: {
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        ...context,
      },
    };

    this.events.push(event);

    // Enforce max entries
    if (this.events.length > this.config.maxEntries.events) {
      this.events.splice(0, this.events.length - this.config.maxEntries.events);
    }

    this.cleanup("events");
  }

  /**
   * Record performance entry
   */
  recordPerformance(
    name: string,
    type: PerformanceEntry["type"],
    startTime: number,
    endTime?: number,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.enabled || !this.shouldSample("performance")) return;

    const entry: PerformanceEntry = {
      name,
      startTime,
      endTime,
      duration: endTime ? endTime - startTime : undefined,
      type,
      metadata: { ...metadata, sessionId: this.sessionId },
    };

    this.performanceEntries.push(entry);

    // Enforce max entries
    if (this.performanceEntries.length > this.config.maxEntries.performance) {
      this.performanceEntries.splice(
        0,
        this.performanceEntries.length - this.config.maxEntries.performance
      );
    }

    this.cleanup("performance");
  }

  /**
   * Record API call performance
   */
  recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    metadata: Record<string, any> = {}
  ): void {
    this.recordPerformance(
      `api_call_${method}_${endpoint}`,
      "api",
      Date.now() - duration,
      Date.now(),
      {
        endpoint,
        method,
        statusCode,
        ...metadata,
      }
    );

    // Also record as metrics
    this.recordMetric("api_calls_total", 1, "counter", {
      endpoint,
      method,
      status: statusCode.toString(),
    });

    this.recordMetric(
      "api_call_duration",
      duration,
      "histogram",
      {
        endpoint,
        method,
      },
      "ms"
    );
  }

  /**
   * Record component render performance
   */
  recordComponentRender(
    componentName: string,
    renderTime: number,
    metadata: Record<string, any> = {}
  ): void {
    this.recordPerformance(
      `component_render_${componentName}`,
      "component",
      Date.now() - renderTime,
      Date.now(),
      {
        componentName,
        ...metadata,
      }
    );

    this.recordMetric(
      "component_render_time",
      renderTime,
      "histogram",
      {
        component: componentName,
      },
      "ms"
    );
  }

  /**
   * Record user action
   */
  recordUserAction(
    action: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.recordEvent(
      `user_action_${action}`,
      "info",
      { action, ...metadata },
      { userId }
    );

    this.incrementCounter("user_actions_total", 1, { action });
  }

  /**
   * Register health check
   */
  registerHealthCheck(
    name: string,
    checkFunction: () => Promise<Omit<HealthCheck, "name" | "timestamp">>
  ): void {
    const runCheck = async () => {
      try {
        const startTime = Date.now();
        const result = await checkFunction();
        const latency = Date.now() - startTime;

        const healthCheck: HealthCheck = {
          name,
          timestamp: Date.now(),
          latency,
          ...result,
        };

        this.healthChecks.set(name, healthCheck);
        this.recordMetric(
          "health_check_latency",
          latency,
          "gauge",
          { check: name },
          "ms"
        );
        this.recordMetric(
          "health_check_status",
          result.status === "healthy" ? 1 : 0,
          "gauge",
          { check: name }
        );
      } catch (error) {
        const healthCheck: HealthCheck = {
          name,
          status: "unhealthy",
          message: (error as Error).message,
          timestamp: Date.now(),
        };

        this.healthChecks.set(name, healthCheck);
        this.recordEvent("health_check_failed", "error", {
          check: name,
          error: (error as Error).message,
        });
      }
    };

    // Run check immediately and then periodically
    runCheck();
    setInterval(runCheck, 30000); // Every 30 seconds
  }

  /**
   * Get current metrics
   */
  getMetrics(name?: string): Metric[] | Map<string, Metric[]> {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return this.metrics;
  }

  /**
   * Get events
   */
  getEvents(type?: ObservabilityEvent["type"]): ObservabilityEvent[] {
    if (type) {
      return this.events.filter((event) => event.type === type);
    }
    return this.events;
  }

  /**
   * Get performance entries
   */
  getPerformanceEntries(type?: PerformanceEntry["type"]): PerformanceEntry[] {
    if (type) {
      return this.performanceEntries.filter((entry) => entry.type === type);
    }
    return this.performanceEntries;
  }

  /**
   * Get health checks
   */
  getHealthChecks(): Map<string, HealthCheck> {
    return this.healthChecks;
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    healthy: boolean;
    checks: HealthCheck[];
    metrics: {
      totalMetrics: number;
      totalEvents: number;
      totalPerformanceEntries: number;
    };
  } {
    const checks = Array.from(this.healthChecks.values());
    const healthy = checks.every((check) => check.status === "healthy");

    return {
      healthy,
      checks,
      metrics: {
        totalMetrics: Array.from(this.metrics.values()).reduce(
          (sum, list) => sum + list.length,
          0
        ),
        totalEvents: this.events.length,
        totalPerformanceEntries: this.performanceEntries.length,
      },
    };
  }

  /**
   * Export data for analysis
   */
  exportData(): {
    metrics: Map<string, Metric[]>;
    events: ObservabilityEvent[];
    performance: PerformanceEntry[];
    healthChecks: HealthCheck[];
    sessionId: string;
    timestamp: number;
  } {
    return {
      metrics: this.metrics,
      events: this.events,
      performance: this.performanceEntries,
      healthChecks: Array.from(this.healthChecks.values()),
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics.clear();
    this.events.splice(0);
    this.performanceEntries.splice(0);
    this.healthChecks.clear();
    this.timers.clear();
  }

  /**
   * Flush data to configured endpoints
   */
  async flush(): Promise<void> {
    if (!this.config.autoFlush.enabled) return;

    const data = this.exportData();

    // In a real implementation, you would send data to your observability backend
    if (this.config.endpoints?.metrics) {
      await this.sendData(this.config.endpoints.metrics, {
        metrics: Array.from(data.metrics.entries()).flatMap(
          ([name, metrics]) => metrics
        ),
      });
    }

    if (this.config.endpoints?.events) {
      await this.sendData(this.config.endpoints.events, {
        events: data.events,
      });
    }

    if (this.config.endpoints?.performance) {
      await this.sendData(this.config.endpoints.performance, {
        performance: data.performance,
      });
    }
  }

  /**
   * Stop the observability system
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Check if should sample
   */
  private shouldSample(type: keyof ObservabilityConfig["sampling"]): boolean {
    return Math.random() < this.config.sampling[type];
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.config.autoFlush.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.autoFlush.interval);
    }
  }

  /**
   * Initialize Performance Observer for browser metrics
   */
  private initializePerformanceObserver(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformance(
            entry.name,
            "navigation",
            entry.startTime,
            entry.startTime + entry.duration,
            {
              entryType: entry.entryType,
              transferSize: (entry as any).transferSize,
              encodedBodySize: (entry as any).encodedBodySize,
            }
          );
        }
      });

      observer.observe({
        entryTypes: ["navigation", "resource", "measure", "mark"],
      });
    } catch (error) {
      console.warn("Performance Observer not supported:", error);
    }
  }

  /**
   * Cleanup old entries
   */
  private cleanup(type: "events" | "metrics" | "performance"): void {
    const now = Date.now();
    const retention = this.config.retention[type];

    switch (type) {
      case "events":
        this.events = this.events.filter(
          (event) => now - event.timestamp < retention
        );
        break;

      case "metrics":
        for (const [name, metricList] of Array.from(this.metrics.entries())) {
          const filteredMetrics = metricList.filter(
            (metric) => now - metric.timestamp < retention
          );
          if (filteredMetrics.length === 0) {
            this.metrics.delete(name);
          } else {
            this.metrics.set(name, filteredMetrics);
          }
        }
        break;

      case "performance":
        this.performanceEntries = this.performanceEntries.filter(
          (entry) => now - entry.startTime < retention
        );
        break;
    }
  }

  /**
   * Send data to endpoint
   */
  private async sendData(endpoint: string, data: any): Promise<void> {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn(`Failed to send observability data to ${endpoint}:`, error);
    }
  }
}

/**
 * Performance monitoring decorators and utilities
 */
export const PerformanceMonitor = {
  /**
   * Monitor function execution time
   */
  time<T extends (...args: any[]) => any>(fn: T, name?: string): T {
    return ((...args: any[]) => {
      const functionName = name || fn.name || "anonymous";
      observabilitySystem.startTimer(functionName);

      try {
        const result = fn(...args);

        if (result instanceof Promise) {
          return result.finally(() => {
            observabilitySystem.stopTimer(functionName);
          });
        } else {
          observabilitySystem.stopTimer(functionName);
          return result;
        }
      } catch (error) {
        observabilitySystem.stopTimer(functionName);
        observabilitySystem.recordEvent("function_error", "error", {
          function: functionName,
          error: (error as Error).message,
        });
        throw error;
      }
    }) as T;
  },

  /**
   * Monitor React component renders
   */
  component<P extends object>(
    Component: React.ComponentType<P>,
    name?: string
  ): React.ComponentType<P> {
    const componentName =
      name || Component.displayName || Component.name || "Unknown";

    return (props: P) => {
      const startTime = Date.now();

      React.useEffect(() => {
        const renderTime = Date.now() - startTime;
        observabilitySystem.recordComponentRender(componentName, renderTime);
      });

      return React.createElement(Component, props);
    };
  },
};

/**
 * Global observability system instance
 */
export const observabilitySystem = new ObservabilitySystem({
  enabled: process.env.NODE_ENV !== "test",
  sampling: {
    events: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    metrics: 1.0,
    performance: process.env.NODE_ENV === "development" ? 1.0 : 0.5,
  },
});

// Register default health checks
observabilitySystem.registerHealthCheck("api", async () => {
  try {
    const response = await fetch("/api/health");
    return {
      status: response.ok ? "healthy" : "degraded",
      message: response.ok
        ? "API is responding"
        : `API returned ${response.status}`,
    };
  } catch {
    return {
      status: "unhealthy",
      message: "API is not reachable",
    };
  }
});

/**
 * React Hook for Observability
 */
export function useObservability() {
  return {
    recordMetric: observabilitySystem.recordMetric.bind(observabilitySystem),
    incrementCounter:
      observabilitySystem.incrementCounter.bind(observabilitySystem),
    setGauge: observabilitySystem.setGauge.bind(observabilitySystem),
    recordEvent: observabilitySystem.recordEvent.bind(observabilitySystem),
    recordUserAction:
      observabilitySystem.recordUserAction.bind(observabilitySystem),
    startTimer: observabilitySystem.startTimer.bind(observabilitySystem),
    stopTimer: observabilitySystem.stopTimer.bind(observabilitySystem),
    getMetrics: observabilitySystem.getMetrics.bind(observabilitySystem),
    getEvents: observabilitySystem.getEvents.bind(observabilitySystem),
    getSystemStatus:
      observabilitySystem.getSystemStatus.bind(observabilitySystem),
  };
}
