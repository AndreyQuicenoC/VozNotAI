import type { TranscriptSegment } from "../utils/transcriptionParsers.ts";

export type { TranscriptSegment };

export type UserRole = "admin" | "customer" | "auditor";

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  avatarUrl: string;
  status: "Activo" | "Limitado" | "Suspendido";
  totalConversations: number;
  accumulatedMinutes: number;
  maxMinutesQuota: number; // 0 for unlimited
  preferredMode: "Local (CUDA)" | "Híbrido / Nube" | "Desactivado";
  consumptionCostUsd: number;
  lastActivity: string;
  lastIp: string;
  mfaActive: boolean;
  createdAt: string;
}

export interface AudioSession {
  id: string;
  title: string;
  filename: string;
  durationSeconds: number;
  formattedDuration: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  format: string; // "FLAC 24-bit 48kHz", "WAV 16-bit 44.1kHz", etc.
  channels: string; // "Estéreo L/R"
  status: "Completado" | "Procesando" | "En cola" | "Listo";
  progressPercentage?: number;
  mode: "Local" | "Cloud";
  space: string; // "Eureka Executive", "Finanzas & Legal", "Producto & UX", "Investigación Médica"
  notesCount: number;
  confidence: number;
  segments: TranscriptSegment[];
  vramUsedGb: number;
  createdAt: string;
  tags?: string[];
}

export interface SmartNote {
  id: string;
  sessionId: string;
  audioTitle: string;
  timestampSeconds: number;
  timestampFormatted: string;
  authorName: string;
  authorRole?: string;
  category: "Resumen Ejecutivo" | "Acción Pendiente" | "Idea Clave" | "Decisión Crítica" | "Infraestructura" | "Hallazgo Clínico";
  tags: string[];
  content: string;
  createdAt: string;
}

export interface SystemSettings {
  executionMode: "local" | "api";
  localModelName: "large-v3" | "medium" | "small";
  localGpuDevice: string;
  localVramUsageGb: number;
  apiEndpoint: string;
  apiKeyMasked: string;
  apiModel: string;
  ratePerMinuteUsd: number;
  maxFileDurationMinutes: number;
  maxConcurrencyPerUser: number;
  monthlyAlertThresholdUsd: number;
  universalLocalPolicy: boolean;
  diarizationEnabled: boolean;
  noiseSuppressionEnabled: boolean;
  longAudioNotificationEnabled: boolean;
  defaultLanguage: string;
  lastSyncTimestamp: string;
}

export interface AuditEvent {
  id: string;
  type: "[TRANSCRIPTION_DISPATCH]" | "[NODE_BALANCER]" | "[QUOTA_EXCEEDED_WARNING]" | "[CONFIG_UPDATE]" | "[AUTH_SUCCESS]";
  description: string;
  user: string;
  hash: string;
  timestamp: string;
  severity: "info" | "warn" | "error";
}

export interface NavigationPath {
  id: string;
  label: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}
