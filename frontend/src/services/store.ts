import { useEffect, useState } from "react";
import type { AudioSession, AuditEvent, SmartNote, SystemSettings, TranscriptSegment, User } from "../types/index.ts";
import { api } from "./api.ts";
import { formatDuration } from "../utils/costCalculator.ts";

export interface UsageSnapshot {
  total_audio_minutes: number;
  total_requests: number;
  estimated_cost_usd: number;
  actual_cost_usd: number | null;
  cost_status_label: string;
  local_audio_minutes: number;
  api_audio_minutes: number;
  quota_minutes_assigned: number;
  quota_percent_used: number;
}

export interface EngineStatus {
  execution_mode: string;
  active_model: string;
  local_available: boolean;
  local_error: string | null;
  local_details: string;
  remote_enabled: boolean;
  ffmpeg_installed: boolean;
}

const EMPTY_SETTINGS: SystemSettings = {
  executionMode: "local",
  localModelName: "base",
  whisperModel: "base",
  failoverCloudApi: false,
  localGpuDevice: "cpu",
  localVramUsageGb: 0,
  apiEndpoint: "",
  apiKeyMasked: "",
  apiModel: "",
  ratePerMinuteUsd: 0.006,
  maxFileDurationMinutes: 2,
  maxConcurrencyPerUser: 1,
  monthlyAlertThresholdUsd: 0,
  universalLocalPolicy: true,
  diarizationEnabled: false,
  noiseSuppression: false,
  noiseSuppressionEnabled: false,
  longAudioNotificationEnabled: false,
  defaultLanguage: "auto",
  lastSyncTimestamp: "",
};

type StoreState = {
  authReady: boolean;
  loading: boolean;
  error: string | null;
  currentUser: User | null;
  users: User[];
  sessions: AudioSession[];
  currentSessionId: string | null;
  notes: SmartNote[];
  settings: SystemSettings;
  auditLogs: AuditEvent[];
  usage: UsageSnapshot | null;
  engineStatus: EngineStatus | null;
};

const state: StoreState = {
  authReady: false,
  loading: false,
  error: null,
  currentUser: null,
  users: [],
  sessions: [],
  currentSessionId: null,
  notes: [],
  settings: { ...EMPTY_SETTINGS },
  auditLogs: [],
  usage: null,
  engineStatus: null,
};

const STORE_EVENT = "voznotai_store_update";
let bootstrapStarted = false;

function notifyUpdate() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "No se pudo completar la operación.";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function mapUser(raw: Record<string, unknown>): User {
  const active = raw.is_active !== false;
  const quota = Number(raw.max_minutes_quota ?? 0);
  const lastLogin = raw.last_login_at ? String(raw.last_login_at) : "";
  const preferred = String(raw.preferred_mode ?? "local");
  return {
    id: String(raw.id ?? ""),
    name: String(raw.first_name ?? ""),
    lastName: String(raw.last_name ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    birthDate: raw.birth_date ? String(raw.birth_date) : "",
    role: raw.role === "admin" ? "admin" : "customer",
    roleTitle: String(raw.role_title ?? raw.role ?? "Cliente"),
    organization: String(raw.organization ?? "ClustLayer"),
    avatarUrl: String(raw.avatar_url ?? ""),
    status: active ? "Activo" : "Suspendido",
    totalConversations: 0,
    accumulatedMinutes: 0,
    maxMinutesQuota: quota,
    preferredMode: preferred.toLowerCase().includes("api") ? "Híbrido / Nube" : "Local (CUDA)",
    consumptionCostUsd: 0,
    lastActivity: lastLogin || "Sin inicio de sesión",
    lastIp: "",
    mfaActive: false,
    createdAt: String(raw.created_at ?? ""),
    isActive: active,
    minutesUsed: 0,
    monthlyQuota: quota,
    lastLogin: lastLogin || String(raw.created_at ?? ""),
  };
}

function mapSegments(raw: unknown): TranscriptSegment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const seg = asRecord(item);
    return {
      id: String(seg.id ?? `seg-${index}`),
      start: Number(seg.start ?? 0),
      end: Number(seg.end ?? 0),
      text: String(seg.text ?? ""),
      speaker: String(seg.speaker ?? "Transcripción"),
      speakerRole: seg.speakerRole ? String(seg.speakerRole) : undefined,
      confidence: typeof seg.confidence === "number" ? seg.confidence : 0,
    };
  });
}

function mapSession(
  conv: Record<string, unknown>,
  transcription?: Record<string, unknown>
): AudioSession {
  const duration = Number(transcription?.duration_seconds ?? 0);
  let segments = mapSegments(transcription?.segments);
  const transcriptText = transcription?.transcript_text ? String(transcription.transcript_text) : "";
  if (segments.length === 0 && transcriptText) {
    segments = [
      {
        id: `${String(transcription?.id ?? conv.id)}-full`,
        start: 0,
        end: duration,
        text: transcriptText,
        speaker: "Transcripción",
        confidence: 0,
      },
    ];
  }
  const provider = String(transcription?.provider ?? "local_whisper");
  const statusRaw = String(transcription?.status ?? "pending");
  const status =
    statusRaw === "completed" ? "Completado" : statusRaw === "failed" ? "Listo" : "Procesando";
  const transcriptionId = transcription?.id ? String(transcription.id) : undefined;
  return {
    id: String(conv.id),
    title: String(conv.title ?? "Conversación"),
    filename: String(conv.title ?? "audio"),
    durationSeconds: duration,
    formattedDuration: formatDuration(duration),
    fileSizeFormatted: "",
    fileSizeBytes: 0,
    format: provider === "remote_api" ? "API" : "Local",
    channels: "",
    status,
    mode: provider === "remote_api" ? "Cloud" : "Local",
    space: "Conversaciones",
    notesCount: Number(conv.notes_count ?? 0),
    confidence: 0,
    segments,
    vramUsedGb: 0,
    createdAt: String(conv.created_at ?? ""),
    transcriptionId,
    audioUrl: transcriptionId ? api.getAudioStreamUrl(transcriptionId) : undefined,
  };
}

function mapNote(raw: Record<string, unknown>, sessions: AudioSession[]): SmartNote {
  const conversationId = raw.conversation_id ? String(raw.conversation_id) : "";
  const session = sessions.find((item) => item.id === conversationId);
  const start = Number(raw.segment_start ?? 0);
  const tags = String(raw.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const category = String(raw.category ?? "Idea Clave") as SmartNote["category"];
  return {
    id: String(raw.id),
    sessionId: conversationId,
    audioTitle: String(raw.title ?? session?.title ?? "Nota"),
    timestampSeconds: start,
    timestampFormatted: formatDuration(start),
    authorName: state.currentUser ? `${state.currentUser.name} ${state.currentUser.lastName}`.trim() : "Usuario",
    authorRole: state.currentUser?.roleTitle,
    category,
    tags,
    content: String(raw.content ?? ""),
    createdAt: String(raw.created_at ?? ""),
  };
}

function mapSettings(raw: Record<string, unknown>): SystemSettings {
  const mode = raw.execution_mode === "api" ? "api" : "local";
  const model = String(raw.local_model_name ?? "base");
  const rate = Number(raw.usage_rate_per_audio_minute ?? 0.006);
  const maxSeconds = Number(raw.maximum_audio_duration_seconds ?? 120);
  return {
    ...EMPTY_SETTINGS,
    executionMode: mode,
    localModelName: model,
    whisperModel: model,
    failoverCloudApi: false,
    apiEndpoint: String(raw.remote_endpoint ?? ""),
    apiKeyMasked: String(raw.remote_api_key_masked ?? ""),
    apiModel: String(raw.remote_model_name ?? ""),
    ratePerMinuteUsd: rate,
    maxFileDurationMinutes: Math.max(1, Math.round(maxSeconds / 60)),
    lastSyncTimestamp: String(raw.updated_at ?? ""),
  };
}

function mapAudit(raw: Record<string, unknown>): AuditEvent {
  const identifier = String(raw.user_identifier ?? "system");
  const eventType = String(raw.event_type ?? "EVENT");
  const description = String(raw.description ?? "");
  return {
    id: String(raw.id),
    type: eventType,
    description,
    user: identifier,
    hash: String(raw.id ?? "").slice(0, 12),
    timestamp: String(raw.created_at ?? ""),
    severity: raw.severity === "error" || raw.severity === "warn" ? raw.severity : "info",
    userId: identifier,
    action: eventType,
    details: description,
  };
}

function mapUsage(raw: Record<string, unknown>): UsageSnapshot {
  return {
    total_audio_minutes: Number(raw.total_audio_minutes ?? 0),
    total_requests: Number(raw.total_requests ?? 0),
    estimated_cost_usd: Number(raw.estimated_cost_usd ?? 0),
    actual_cost_usd: raw.actual_cost_usd == null ? null : Number(raw.actual_cost_usd),
    cost_status_label: String(raw.cost_status_label ?? "No disponible"),
    local_audio_minutes: Number(raw.local_audio_minutes ?? 0),
    api_audio_minutes: Number(raw.api_audio_minutes ?? 0),
    quota_minutes_assigned: Number(raw.quota_minutes_assigned ?? 0),
    quota_percent_used: Number(raw.quota_percent_used ?? 0),
  };
}

async function refreshWorkspace() {
  const [conversations, transcriptions, notes, settingsRaw, usageRaw, statusRaw] = await Promise.all([
    api.listConversations(),
    api.listTranscriptions(),
    api.listNotes(),
    api.getSystemSettings().catch(() => null),
    api.getUsageSummary().catch(() => null),
    api.getSystemStatus().catch(() => null),
  ]);

  const latestByConversation = new Map<string, Record<string, unknown>>();
  for (const item of transcriptions) {
    const conversationId = item.conversation_id ? String(item.conversation_id) : "";
    if (conversationId && !latestByConversation.has(conversationId)) {
      latestByConversation.set(conversationId, item);
    }
  }

  state.sessions = conversations.map((conv) =>
    mapSession(conv, latestByConversation.get(String(conv.id)))
  );
  if (!state.currentSessionId || !state.sessions.some((session) => session.id === state.currentSessionId)) {
    state.currentSessionId = state.sessions[0]?.id ?? null;
  }
  state.notes = notes.map((note) => mapNote(note, state.sessions));
  if (settingsRaw) state.settings = mapSettings(settingsRaw);
  if (usageRaw) {
    state.usage = mapUsage(usageRaw);
    if (state.currentUser) {
      state.currentUser = {
        ...state.currentUser,
        accumulatedMinutes: state.usage.total_audio_minutes,
        minutesUsed: state.usage.total_audio_minutes,
        consumptionCostUsd: state.usage.estimated_cost_usd,
        totalConversations: state.sessions.length,
      };
    }
  }
  if (statusRaw) {
    const local = asRecord(statusRaw.local_whisper);
    const remote = asRecord(statusRaw.remote_api);
    const requirements = asRecord(statusRaw.system_requirements);
    state.engineStatus = {
      execution_mode: String(statusRaw.execution_mode ?? "local"),
      active_model: String(statusRaw.active_model ?? ""),
      local_available: Boolean(local.available),
      local_error: local.error ? String(local.error) : null,
      local_details: String(local.details ?? ""),
      remote_enabled: Boolean(remote.enabled),
      ffmpeg_installed: Boolean(requirements.ffmpeg_installed),
    };
  }

  if (state.currentUser?.role === "admin") {
    const [adminUsers, audit] = await Promise.all([
      api.listAdminUsers().catch(() => ({ users: [], total: 0 })),
      api.listAuditLogs().catch(() => []),
    ]);
    state.users = adminUsers.users.map(mapUser);
    state.auditLogs = audit.map(mapAudit);
  } else if (state.currentUser) {
    state.users = [state.currentUser];
    state.auditLogs = [];
  }
}

async function bootstrap() {
  state.loading = true;
  notifyUpdate();
  try {
    const profile = await api.getProfile();
    state.currentUser = mapUser(profile);
    await refreshWorkspace();
    state.error = null;
  } catch {
    state.currentUser = null;
    api.setToken(null);
  } finally {
    state.loading = false;
    state.authReady = true;
    notifyUpdate();
  }
}

export function useVozNotStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handle = () => setTick((tick) => tick + 1);
    window.addEventListener(STORE_EVENT, handle);
    if (!bootstrapStarted) {
      bootstrapStarted = true;
      void bootstrap();
    }
    return () => window.removeEventListener(STORE_EVENT, handle);
  }, []);

  const activeSession =
    state.sessions.find((session) => session.id === state.currentSessionId) ?? null;

  const login = async (email: string, password: string) => {
    state.loading = true;
    state.error = null;
    notifyUpdate();
    try {
      const response = await api.login(email, password);
      state.currentUser = mapUser(asRecord(response.user));
      await refreshWorkspace();
      return true;
    } catch (err) {
      state.error = errorMessage(err);
      return false;
    } finally {
      state.loading = false;
      notifyUpdate();
    }
  };

  const register = async (data: {
    name: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    state.loading = true;
    state.error = null;
    notifyUpdate();
    try {
      const response = await api.register({
        first_name: data.name,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      state.currentUser = mapUser(asRecord(response.user));
      await refreshWorkspace();
      return state.currentUser;
    } catch (err) {
      state.error = errorMessage(err);
      return null;
    } finally {
      state.loading = false;
      notifyUpdate();
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      state.currentUser = null;
      state.users = [];
      state.sessions = [];
      state.notes = [];
      state.auditLogs = [];
      state.usage = null;
      state.currentSessionId = null;
      state.engineStatus = null;
      notifyUpdate();
    }
  };

  const updateUser = async (updated: Partial<User>) => {
    try {
      const saved = await api.updateProfile({
        first_name: updated.name,
        last_name: updated.lastName,
        phone: updated.phone,
      });
      state.currentUser = mapUser(saved);
      state.error = null;
      notifyUpdate();
      return true;
    } catch (err) {
      state.error = errorMessage(err);
      notifyUpdate();
      return false;
    }
  };

  const selectSession = (sessionId: string) => {
    state.currentSessionId = sessionId;
    notifyUpdate();
  };

  const addSession = (session: AudioSession) => {
    state.sessions = [session, ...state.sessions.filter((item) => item.id !== session.id)];
    state.currentSessionId = session.id;
    notifyUpdate();
  };

  const updateSession = async (sessionId: string, updates: Partial<AudioSession>) => {
    if (updates.title) {
      try {
        await api.updateConversationTitle(sessionId, updates.title);
      } catch (err) {
        state.error = errorMessage(err);
        notifyUpdate();
        return;
      }
    }
    state.sessions = state.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    notifyUpdate();
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await api.deleteConversation(sessionId);
      state.sessions = state.sessions.filter((session) => session.id !== sessionId);
      state.notes = state.notes.filter((note) => note.sessionId !== sessionId);
      if (state.currentSessionId === sessionId) {
        state.currentSessionId = state.sessions[0]?.id ?? null;
      }
      state.error = null;
    } catch (err) {
      state.error = errorMessage(err);
    }
    notifyUpdate();
  };

  const addNote = async (note: Omit<SmartNote, "id" | "createdAt">) => {
    try {
      await api.createNote({
        title: note.audioTitle || note.category || "Nota",
        content: note.content,
        category: note.category,
        tags: note.tags.join(", "),
        conversation_id: note.sessionId,
        segment_start: note.timestampSeconds,
      });
      const notes = await api.listNotes();
      state.notes = notes.map((item) => mapNote(item, state.sessions));
      state.error = null;
    } catch (err) {
      state.error = errorMessage(err);
    }
    notifyUpdate();
  };

  const deleteNote = async (noteId: string) => {
    try {
      await api.deleteNote(noteId);
      state.notes = state.notes.filter((note) => note.id !== noteId);
      state.error = null;
    } catch (err) {
      state.error = errorMessage(err);
    }
    notifyUpdate();
  };

  const updateSettings = async (updates: Partial<SystemSettings> & Record<string, unknown>) => {
    if (updates.failoverCloudApi) {
      state.error = "No hay cambio automático al motor local si el proveedor API falla.";
      notifyUpdate();
      return;
    }
    const payload: Record<string, unknown> = {};
    if (updates.executionMode === "local" || updates.executionMode === "api") {
      payload.execution_mode = updates.executionMode;
    }
    const model = updates.whisperModel ?? updates.localModelName;
    if (model === "base" || model === "small") payload.local_model_name = model;
    if (typeof updates.apiEndpoint === "string" && updates.apiEndpoint) {
      payload.remote_endpoint = updates.apiEndpoint;
    }
    if (typeof updates.ratePerMinuteUsd === "number") {
      payload.usage_rate_per_audio_minute = updates.ratePerMinuteUsd;
    }

    if (Object.keys(payload).length > 0 && state.currentUser?.role !== "admin") {
      state.error = "Solo un administrador puede cambiar el motor de transcripción.";
      notifyUpdate();
      return;
    }

    if (Object.keys(payload).length > 0) {
      try {
        const saved = await api.updateSystemSettings(payload);
        state.settings = mapSettings(saved);
        state.error = null;
      } catch (err) {
        state.error = errorMessage(err);
      }
      notifyUpdate();
      return;
    }

    state.settings = { ...state.settings, ...updates, lastSyncTimestamp: new Date().toISOString() };
    notifyUpdate();
  };

  const updateUserQuota = async (userId: string, minutes: number) => {
    try {
      await api.updateAdminUser(userId, { max_minutes_quota: minutes });
      await refreshWorkspace();
      state.error = null;
    } catch (err) {
      state.error = errorMessage(err);
    }
    notifyUpdate();
  };

  const toggleUserStatus = async (userId: string) => {
    const target = state.users.find((user) => user.id === userId);
    if (!target) return;
    try {
      await api.updateAdminUser(userId, { is_active: !target.isActive });
      await refreshWorkspace();
      state.error = null;
    } catch (err) {
      state.error = errorMessage(err);
    }
    notifyUpdate();
  };

  const refresh = async () => {
    if (!state.currentUser) return;
    try {
      await refreshWorkspace();
      state.error = null;
    } catch (err) {
      state.error = errorMessage(err);
    }
    notifyUpdate();
  };

  return {
    authReady: state.authReady,
    loading: state.loading,
    error: state.error,
    currentUser: state.currentUser,
    users: state.users,
    sessions: state.sessions,
    activeSession,
    currentSessionId: state.currentSessionId,
    setCurrentSessionId: selectSession,
    notes: state.notes,
    settings: state.settings,
    auditLogs: state.auditLogs,
    auditEvents: state.auditLogs,
    usage: state.usage,
    engineStatus: state.engineStatus,
    login,
    register,
    logout,
    switchUser: (_userId: string) => {
      state.error = "El cambio de persona de demostración no está disponible.";
      notifyUpdate();
    },
    updateUser,
    selectSession,
    addSession,
    updateSession,
    deleteSession,
    addNote,
    deleteNote,
    updateSettings,
    restoreSettingsDefaults: () => {
      state.error = "Los valores del motor se restauran desde la configuración del servidor.";
      notifyUpdate();
    },
    addAuditEvent: (_event: unknown) => {
      state.error = null;
    },
    updateUserQuota,
    toggleUserStatus,
    refresh,
  };
}
