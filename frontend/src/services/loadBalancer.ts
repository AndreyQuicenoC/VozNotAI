/**
 * ClustLayer • Eureka Load Balancer & Worker Cluster Service
 * Manages GPU worker pools, load distribution, and Cloud API failover routing.
 */

export interface GpuWorker {
  id: string;
  name: string;
  device: string; // e.g. "NVIDIA GeForce RTX 4090"
  vramTotalGb: number;
  vramUsedGb: number;
  temperatureC: number;
  activeJobs: number;
  maxConcurrency: number;
  status: "online" | "busy" | "standby" | "offline";
  avgLatencyMs: number;
  processedCount: number;
}

export type SystemInferenceMode =
  | "local_balanced" // Default for sovereign on-prem GPU cluster
  | "cloud_api" // Admin-selected Cloud API mode
  | "hybrid_failover"; // Auto-route to cloud if local queue is full

export interface LoadBalancerState {
  systemMode: SystemInferenceMode;
  algorithm: "least_connections" | "round_robin";
  workers: GpuWorker[];
  apiEndpointConfig: {
    endpointUrl: string;
    isConfigured: boolean;
    provider: "Whisper Cloud OpenAI" | "Groq Whisper" | "Custom Sovereign Gateway";
    timeoutMs: number;
  };
  totalJobsDispatched: number;
}

const INITIAL_WORKERS: GpuWorker[] = [
  {
    id: "worker-gpu-0",
    name: "Nodo Primario (GPU 0)",
    device: "NVIDIA GeForce RTX 4090",
    vramTotalGb: 24,
    vramUsedGb: 19.8,
    temperatureC: 64.2,
    activeJobs: 1,
    maxConcurrency: 4,
    status: "online",
    avgLatencyMs: 42,
    processedCount: 1140,
  },
  {
    id: "worker-gpu-1",
    name: "Nodo Failover (GPU 1)",
    device: "NVIDIA GeForce RTX 3090",
    vramTotalGb: 24,
    vramUsedGb: 6.2,
    temperatureC: 51.0,
    activeJobs: 0,
    maxConcurrency: 3,
    status: "standby",
    avgLatencyMs: 68,
    processedCount: 280,
  },
];

class LoadBalancerService {
  private state: LoadBalancerState;
  private roundRobinIndex = 0;
  private listeners: Array<() => void> = [];

  constructor() {
    let saved: string | null = null;
    if (typeof localStorage !== "undefined") {
      try {
        saved = localStorage.getItem("voznot_cluster_load_balancer");
      } catch {
        saved = null;
      }
    }
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch {
        this.state = this.getDefaultState();
      }
    } else {
      this.state = this.getDefaultState();
    }
  }

  private getDefaultState(): LoadBalancerState {
    return {
      systemMode: "local_balanced",
      algorithm: "least_connections",
      workers: INITIAL_WORKERS,
      apiEndpointConfig: {
        endpointUrl: "https://api.openai.com/v1/audio/transcriptions",
        isConfigured: false,
        provider: "Whisper Cloud OpenAI",
        timeoutMs: 30000,
      },
      totalJobsDispatched: 1420,
    };
  }

  private persist() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("voznot_cluster_load_balancer", JSON.stringify(this.state));
      } catch {
        // Ignore storage errors in restricted contexts
      }
    }
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): LoadBalancerState {
    return { ...this.state };
  }

  /**
   * Only administrators can change the system-wide inference mode.
   */
  public setSystemMode(mode: SystemInferenceMode, updatedByRole: string): boolean {
    if (updatedByRole !== "admin") {
      console.warn("Permiso denegado: Solo administradores pueden cambiar el modo de inferencia global.");
      return false;
    }
    this.state.systemMode = mode;
    this.persist();
    return true;
  }

  public setAlgorithm(algorithm: "least_connections" | "round_robin", updatedByRole: string): boolean {
    if (updatedByRole !== "admin") return false;
    this.state.algorithm = algorithm;
    this.persist();
    return true;
  }

  public configureApiEndpoint(config: Partial<LoadBalancerState["apiEndpointConfig"]>, updatedByRole: string): boolean {
    if (updatedByRole !== "admin") return false;
    this.state.apiEndpointConfig = { ...this.state.apiEndpointConfig, ...config };
    this.persist();
    return true;
  }

  /**
   * Dispatches an incoming transcription task through the load balancer.
   * Regular users do not choose the target: the cluster routes it authoritatively.
   */
  public dispatchTask(audioDurationSec: number): {
    route: "local_gpu" | "cloud_api";
    workerAssigned?: GpuWorker;
    estimatedLatencyMs: number;
    jobTicket: string;
  } {
    this.state.totalJobsDispatched += 1;
    const ticketId = `JOB-${Date.now().toString(36).toUpperCase()}`;

    // Cloud API mode direct route
    if (this.state.systemMode === "cloud_api") {
      this.persist();
      return {
        route: "cloud_api",
        estimatedLatencyMs: 450 + Math.round(audioDurationSec * 15),
        jobTicket: ticketId,
      };
    }

    // Local Balanced routing (least-connections or round-robin)
    const availableWorkers = this.state.workers.filter(
      (w) => w.status === "online" || w.status === "standby"
    );

    if (availableWorkers.length === 0) {
      // Emergency failover to API if configured or fallback
      this.persist();
      return {
        route: "cloud_api",
        estimatedLatencyMs: 600,
        jobTicket: ticketId,
      };
    }

    let selectedWorker: GpuWorker;

    if (this.state.algorithm === "least_connections") {
      selectedWorker = [...availableWorkers].sort(
        (a, b) => a.activeJobs / a.maxConcurrency - b.activeJobs / b.maxConcurrency
      )[0];
    } else {
      this.roundRobinIndex = (this.roundRobinIndex + 1) % availableWorkers.length;
      selectedWorker = availableWorkers[this.roundRobinIndex];
    }

    // Update worker metrics
    selectedWorker.activeJobs = Math.min(selectedWorker.maxConcurrency, selectedWorker.activeJobs + 1);
    selectedWorker.processedCount += 1;
    selectedWorker.status = selectedWorker.activeJobs >= selectedWorker.maxConcurrency ? "busy" : "online";

    this.persist();

    // Auto-release after simulated execution window
    setTimeout(() => {
      selectedWorker.activeJobs = Math.max(0, selectedWorker.activeJobs - 1);
      selectedWorker.status = selectedWorker.activeJobs === 0 && selectedWorker.id.includes("gpu-1") ? "standby" : "online";
      this.persist();
    }, 4000);

    return {
      route: "local_gpu",
      workerAssigned: selectedWorker,
      estimatedLatencyMs: selectedWorker.avgLatencyMs + Math.round(audioDurationSec * 2.5),
      jobTicket: ticketId,
    };
  }
}

export const loadBalancer = new LoadBalancerService();
