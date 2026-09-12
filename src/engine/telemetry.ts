export interface PerformanceTelemetry {
  fps: number;
  frameTimeMs: number;
  gpuMemoryEstimatedMb: number;
  activeTriangles: number;
  featureRecomputeHistory: {
    featureName: string;
    durationMs: number;
    timestamp: number;
  }[];
}

class TelemetryTracker {
  private static instance: TelemetryTracker;
  private history: { featureName: string; durationMs: number; timestamp: number }[] = [];
  private lastFps: number = 60;

  private constructor() {}

  public static getInstance(): TelemetryTracker {
    if (!TelemetryTracker.instance) {
      TelemetryTracker.instance = new TelemetryTracker();
    }
    return TelemetryTracker.instance;
  }

  public recordFeatureRecompute(featureName: string, durationMs: number): void {
    this.history.push({
      featureName,
      durationMs,
      timestamp: Date.now(),
    });
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  public getTelemetry(): PerformanceTelemetry {
    return {
      fps: this.lastFps,
      frameTimeMs: Number((1000 / this.lastFps).toFixed(1)),
      gpuMemoryEstimatedMb: 38.4,
      activeTriangles: 48200,
      featureRecomputeHistory: [...this.history],
    };
  }
}

export const telemetry = TelemetryTracker.getInstance();
