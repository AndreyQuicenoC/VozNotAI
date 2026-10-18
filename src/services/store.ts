import { useState, useEffect } from "react";
import type { User, AudioSession, SmartNote, SystemSettings, AuditEvent } from "../types/index.ts";
import { formatDuration } from "../utils/costCalculator.ts";

const INITIAL_USERS: User[] = [
  {
    id: "usr-01",
    name: "Andrey",
    lastName: "Quiceno",
    email: "andrey.quiceno@eureka.ai",
    phone: "+57 300 123 4567",
    birthDate: "1992-06-18",
    role: "admin",
    roleTitle: "Super Admin",
    organization: "ClustLayer Core / Eureka",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHN2yAQ3Ir0Nk2YHUV55R7StCOxxri1j-gGHhz0qu8o3QtYmpq9HpbbgrEt9sqkAwJbmnnlhnu5q3XDVbNHmHQUiie4f2PRpKv4lJgBWdnc7ece6zF9NRyE0ZZ256wXP3Tb4doNjPDoGHHghegPFa22zsDf4kRpMoibmlPbldrbyPd9_5cD8gaNR96-uezJj3iKAHttENYIB4scWUYMgV1HQK2LDtElBIPiN-qF9cs-qzDcbLoXFnL",
    status: "Activo",
    totalConversations: 412,
    accumulatedMinutes: 8420,
    maxMinutesQuota: 0,
    preferredMode: "Local (CUDA)",
    consumptionCostUsd: 0.00,
    lastActivity: "Hace 3 min",
    lastIp: "192.168.1.42 (Bogotá, CO)",
    mfaActive: true,
    createdAt: "14 Feb, 2024",
  },
  {
    id: "usr-02",
    name: "Valeria",
    lastName: "Restrepo",
    email: "vrestrepo@clinica-norte.co",
    phone: "+57 310 987 6543",
    birthDate: "1988-11-04",
    role: "customer",
    roleTitle: "Cliente Pro",
    organization: "Clínica Médica Norte",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "Activo",
    totalConversations: 184,
    accumulatedMinutes: 3120,
    maxMinutesQuota: 4000,
    preferredMode: "Local (CUDA)",
    consumptionCostUsd: 4.10,
    lastActivity: "Hace 28 min",
    lastIp: "190.25.12.98 (Medellín, CO)",
    mfaActive: true,
    createdAt: "03 Ene, 2024",
  },
  {
    id: "usr-03",
    name: "Santiago",
    lastName: "Cárdenas",
    email: "scardenas@bufetelex.com",
    phone: "+57 315 555 1234",
    birthDate: "1985-04-22",
    role: "auditor",
    roleTitle: "Auditor Legal",
    organization: "Bufete Lex & Compliance",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "Activo",
    totalConversations: 96,
    accumulatedMinutes: 1890,
    maxMinutesQuota: 3000,
    preferredMode: "Híbrido / Nube",
    consumptionCostUsd: 38.45,
    lastActivity: "Hace 2 horas",
    lastIp: "181.143.90.11 (Cali, CO)",
    mfaActive: true,
    createdAt: "22 Mar, 2024",
  },
  {
    id: "usr-04",
    name: "Mariana",
    lastName: "Hoyos",
    email: "mhoyos@finanzascorp.com",
    phone: "+57 301 234 5678",
    birthDate: "1994-09-15",
    role: "customer",
    roleTitle: "Cliente Pro",
    organization: "FinanzasCorp Latam",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    status: "Limitado",
    totalConversations: 74,
    accumulatedMinutes: 1980,
    maxMinutesQuota: 2000,
    preferredMode: "Local (CUDA)",
    consumptionCostUsd: 0.00,
    lastActivity: "Hace 5 horas",
    lastIp: "190.158.45.67 (Bogotá, CO)",
    mfaActive: false,
    createdAt: "10 Dic, 2024",
  },
  {
    id: "usr-05",
    name: "Esteban",
    lastName: "Correa",
    email: "ecorrea@mediavanguard.io",
    phone: "+57 320 111 2233",
    birthDate: "1990-12-01",
    role: "customer",
    roleTitle: "Cliente Pro",
    organization: "Media Vanguard Org",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    status: "Suspendido",
    totalConversations: 12,
    accumulatedMinutes: 420,
    maxMinutesQuota: 1000,
    preferredMode: "Desactivado",
    consumptionCostUsd: 71.73,
    lastActivity: "Hace 8 días",
    lastIp: "201.244.15.8 (Barranquilla, CO)",
    mfaActive: false,
    createdAt: "05 Nov, 2024",
  },
  {
    id: "usr-06",
    name: "Paula",
    lastName: "Salazar",
    email: "psalazar@kpmg-audit.es",
    phone: "+34 612 345 678",
    birthDate: "1991-03-30",
    role: "auditor",
    roleTitle: "Auditor Externo",
    organization: "KPMG Security Lab",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "Activo",
    totalConversations: 58,
    accumulatedMinutes: 910,
    maxMinutesQuota: 1500,
    preferredMode: "Local (CUDA)",
    consumptionCostUsd: 0.00,
    lastActivity: "Ayer 18:40",
    lastIp: "88.22.140.5 (Madrid, ES)",
    mfaActive: true,
    createdAt: "18 Ene, 2025",
  },
];

const INITIAL_SESSIONS: AudioSession[] = [
  {
    id: "sess-01",
    title: "Auditoría_Estratégica_Trimestral_Q3.wav",
    filename: "Auditoría_Estratégica_Trimestral_Q3.wav",
    durationSeconds: 2538, // 42m 18s
    formattedDuration: "42m 18s",
    fileSizeFormatted: "384.2 MB",
    fileSizeBytes: 402866176,
    format: "FLAC 24-bit 48kHz",
    channels: "Estéreo L/R",
    status: "Completado",
    mode: "Local",
    space: "Finanzas & Legal",
    notesCount: 4,
    confidence: 99.8,
    vramUsedGb: 6.8,
    createdAt: "Hoy, 10:45 AM",
    tags: ["Finanzas", "Confidencial", "Sprint Review"],
    segments: [
      {
        id: "seg-01",
        start: 15.04,
        end: 23.80,
        speaker: "Andrey Quiceno (Hablante 1)",
        speakerRole: "Director de IA",
        text: "Iniciamos formalmente la revisión del trimestre Q3. El objetivo es evaluar el rendimiento de inferencia y la integración del motor Whisper local dentro de la infraestructura ClustLayer para garantizar soberanía de datos y cero latencia.",
        confidence: 0.994,
      },
      {
        id: "seg-02",
        start: 258.00, // 04:18
        end: 278.50,
        speaker: "Elena Morales (Hablante 2)",
        speakerRole: "Auditoría Financiera",
        text: "Desde el punto de vista presupuestario, eliminar los tokens de API comercial nos ha ahorrado cerca de 4,200 dólares este mes. Además, el protocolo de cumplimiento GDPR y HIPAA queda totalmente satisfecho al no enviar audios de pacientes a proveedores externos.",
        confidence: 0.989,
      },
      {
        id: "seg-03",
        start: 872.00, // 14:32
        end: 895.20,
        speaker: "Andrey Quiceno (Hablante 1)",
        speakerRole: "Director de IA",
        text: "Exactamente. Por eso la decisión de migrar permanentemente a Whisper local con aceleración TensorRT en la RTX 4090 es irreversible. No solo optimizamos costo sino que reducimos el factor de transcripción a 1.2x del tiempo real.",
        confidence: 0.996,
      },
      {
        id: "seg-04",
        start: 1264.00, // 21:04
        end: 1289.40,
        speaker: "Carlos Restrepo (Hablante 3)",
        speakerRole: "DevOps Eureka",
        text: "Las métricas del contenedor Docker en eureka-node-01 muestran un uso térmico estable de 62°C. Hemos fijado el pipeline con Whisper Large-v3 y cuantización FP16, logrando una precisión fonética excepcional en tecnicismos legales y financieros en español.",
        confidence: 0.991,
      },
      {
        id: "seg-05",
        start: 2110.00, // 35:10
        end: 2135.00,
        speaker: "Andrey Quiceno (Hablante 1)",
        speakerRole: "Director de IA",
        text: "Perfecto. Procedemos entonces con la aprobación del acta trimestral. VozNotAI exportará automáticamente los reportes con los timestamps verificados y el resumen ejecutivo estructurado para la mesa directiva.",
        confidence: 0.995,
      },
    ],
  },
  {
    id: "sess-02",
    title: "Comite_Estrategico_Q3_ClustLayer.m4a",
    filename: "Comite_Estrategico_Q3_ClustLayer.m4a",
    durationSeconds: 2892, // 48m 12s
    formattedDuration: "48m 12s",
    fileSizeFormatted: "142.5 MB",
    fileSizeBytes: 149422080,
    format: "M4A AAC 192kbps",
    channels: "Estéreo L/R",
    status: "Procesando",
    progressPercentage: 82,
    mode: "Local",
    space: "Eureka Executive",
    notesCount: 4,
    confidence: 99.2,
    vramUsedGb: 6.2,
    createdAt: "Hoy, 10:24 AM",
    tags: ["Comité", "Estrategia", "Cluster"],
    segments: [
      {
        id: "seg-c1",
        start: 10.0,
        end: 35.0,
        speaker: "Andrey Quiceno",
        speakerRole: "Super Admin",
        text: "Acuerdo preliminar para la apertura de nodos de cómputo en la región Sur con cifrado de hardware en reposo.",
        confidence: 0.991,
      },
    ],
  },
  {
    id: "sess-03",
    title: "Auditoria_Financiera_Periodo2.wav",
    filename: "Auditoria_Financiera_Periodo2.wav",
    durationSeconds: 4440, // 1h 14m
    formattedDuration: "1h 14m",
    fileSizeFormatted: "620.1 MB",
    fileSizeBytes: 650221977,
    format: "WAV 24-bit 48kHz",
    channels: "Estéreo L/R",
    status: "Completado",
    mode: "Local",
    space: "Finanzas & Legal",
    notesCount: 8,
    confidence: 99.5,
    vramUsedGb: 6.8,
    createdAt: "Ayer, 04:15 PM",
    tags: ["Auditoría", "Legal", "Finanzas"],
    segments: [],
  },
  {
    id: "sess-04",
    title: "Sprint_Review_Eureka_Frontend.mp3",
    filename: "Sprint_Review_Eureka_Frontend.mp3",
    durationSeconds: 1600, // 26m 40s
    formattedDuration: "26m 40s",
    fileSizeFormatted: "48.2 MB",
    fileSizeBytes: 50541363,
    format: "MP3 320kbps",
    channels: "Estéreo L/R",
    status: "Completado",
    mode: "Cloud",
    space: "Producto & UX",
    notesCount: 3,
    confidence: 98.9,
    vramUsedGb: 0,
    createdAt: "22 Mar, 11:00 AM",
    tags: ["Sprint", "Frontend", "UX"],
    segments: [],
  },
  {
    id: "sess-05",
    title: "Entrevista_Clinica_Evaluacion_09.flac",
    filename: "Entrevista_Clinica_Evaluacion_09.flac",
    durationSeconds: 2045, // 34m 05s
    formattedDuration: "34m 05s",
    fileSizeFormatted: "210.8 MB",
    fileSizeBytes: 221039820,
    format: "FLAC 24-bit",
    channels: "Mono 48kHz",
    status: "Completado",
    mode: "Local",
    space: "Investigación Médica",
    notesCount: 6,
    confidence: 99.7,
    vramUsedGb: 6.8,
    createdAt: "21 Mar, 05:40 PM",
    tags: ["Clínica", "HIPAA", "Investigación"],
    segments: [],
  },
  {
    id: "sess-06",
    title: "Junta_Directiva_Eureka_Oct.m4a",
    filename: "Junta_Directiva_Eureka_Oct.m4a",
    durationSeconds: 4460, // 01:14:20
    formattedDuration: "01:14:20",
    fileSizeFormatted: "189.4 MB",
    fileSizeBytes: 198600294,
    format: "M4A 192kbps",
    channels: "Estéreo L/R",
    status: "Procesando",
    progressPercentage: 64,
    mode: "Local",
    space: "Eureka Executive",
    notesCount: 2,
    confidence: 99.1,
    vramUsedGb: 6.8,
    createdAt: "Hoy, 08:30 AM",
    tags: ["Junta", "Directiva"],
    segments: [],
  },
  {
    id: "sess-07",
    title: "Sesion_Legal_Arbitraje_Voz.wav",
    filename: "Sesion_Legal_Arbitraje_Voz.wav",
    durationSeconds: 3270, // 54:30
    formattedDuration: "54m 30s",
    fileSizeFormatted: "450.2 MB",
    fileSizeBytes: 472068915,
    format: "WAV 16-bit 44.1kHz",
    channels: "Estéreo L/R",
    status: "En cola",
    mode: "Local",
    space: "Finanzas & Legal",
    notesCount: 0,
    confidence: 0,
    vramUsedGb: 0,
    createdAt: "24 Oct, 11:20 AM",
    tags: ["Legal", "Arbitraje"],
    segments: [],
  },
  {
    id: "sess-08",
    title: "Sync_Arquitectura_ClustLayer.ogg",
    filename: "Sync_Arquitectura_ClustLayer.ogg",
    durationSeconds: 1872, // 31:12
    formattedDuration: "31m 12s",
    fileSizeFormatted: "74.1 MB",
    fileSizeBytes: 77700096,
    format: "OGG Vorbis",
    channels: "Estéreo L/R",
    status: "Listo",
    mode: "Local",
    space: "Eureka Executive",
    notesCount: 5,
    confidence: 99.3,
    vramUsedGb: 6.8,
    createdAt: "22 Oct, 09:00 AM",
    tags: ["Arquitectura", "ClustLayer"],
    segments: [],
  },
];

const INITIAL_NOTES: SmartNote[] = [
  {
    id: "note-01",
    sessionId: "sess-01",
    audioTitle: "Comite_Estrategico_Q3.m4a",
    timestampSeconds: 2050, // 34:10
    timestampFormatted: "34:10",
    authorName: "Andrey Quiceno",
    authorRole: "Director de IA",
    category: "Resumen Ejecutivo",
    tags: ["Estrategia", "Criptografía"],
    content: "Acuerdo final para acelerar el despliegue del nodo Eureka en la región Sur con cifrado post-cuántico y hardware dedicado.",
    createdAt: "Hoy 10:48 AM",
  },
  {
    id: "note-02",
    sessionId: "sess-01",
    audioTitle: "Auditoria_Financiera.wav",
    timestampSeconds: 3124, // 52:04
    timestampFormatted: "52:04",
    authorName: "Andrey Quiceno",
    authorRole: "Super Admin",
    category: "Acción Pendiente",
    tags: ["Infraestructura", "Docker"],
    content: "Andrey Quiceno validará la compatibilidad de los contenedores Docker en el host Nvidia Tesla A100 y cluster RTX 4090.",
    createdAt: "Ayer",
  },
  {
    id: "note-03",
    sessionId: "sess-01",
    audioTitle: "Sprint_Review_Eureka.mp3",
    timestampSeconds: 858, // 14:18
    timestampFormatted: "14:18",
    authorName: "Carlos Restrepo",
    authorRole: "DevOps Eureka",
    category: "Idea Clave",
    tags: ["PostgreSQL", "pgvector"],
    content: "Implementar indexación vectorizada en PostgreSQL usando pgvector para búsqueda fonética directa de segmentos de audio.",
    createdAt: "22 Mar",
  },
  {
    id: "note-04",
    sessionId: "sess-01",
    audioTitle: "Auditoría_Estratégica_Trimestral_Q3.wav",
    timestampSeconds: 258, // 04:18
    timestampFormatted: "04:18",
    authorName: "Elena Morales",
    authorRole: "Auditoría Financiera",
    category: "Resumen Ejecutivo",
    tags: ["Finanzas", "HIPAA"],
    content: "Ahorro certificado de $4,200 USD/mes al reemplazar APIs comerciales por Whisper Local. Cumplimiento HIPAA garantizado.",
    createdAt: "Ayer",
  },
  {
    id: "note-05",
    sessionId: "sess-01",
    audioTitle: "Auditoría_Estratégica_Trimestral_Q3.wav",
    timestampSeconds: 872, // 14:32
    timestampFormatted: "14:32",
    authorName: "Andrey Quiceno",
    authorRole: "Director de IA",
    category: "Decisión Crítica",
    tags: ["Decisión Crítica", "TensorRT"],
    content: "Confirmación de arquitectura: RTX 4090 con TensorRT logra velocidad 1.2x en tiempo real sin dependencias externas.",
    createdAt: "Hoy",
  },
  {
    id: "note-06",
    sessionId: "sess-01",
    audioTitle: "Auditoría_Estratégica_Trimestral_Q3.wav",
    timestampSeconds: 1264, // 21:04
    timestampFormatted: "21:04",
    authorName: "Carlos Restrepo",
    authorRole: "DevOps Eureka",
    category: "Infraestructura",
    tags: ["Infraestructura", "FP16"],
    content: "Modelo fijado: Whisper Large-v3 con cuantización FP16 en cluster Docker nodo eureka-01.",
    createdAt: "22 Mar",
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  executionMode: "local",
  localModelName: "large-v3",
  localGpuDevice: "NVIDIA GeForce RTX 4090 (24GB VRAM)",
  localVramUsageGb: 6.2,
  apiEndpoint: "https://api.openai.com/v1/audio/transcriptions",
  apiKeyMasked: "sk-proj-994829384729104820194820938420",
  apiModel: "whisper-1",
  ratePerMinuteUsd: 0.006,
  maxFileDurationMinutes: 90,
  maxConcurrencyPerUser: 3,
  monthlyAlertThresholdUsd: 250,
  universalLocalPolicy: true,
  diarizationEnabled: true,
  noiseSuppressionEnabled: true,
  longAudioNotificationEnabled: true,
  defaultLanguage: "Español (Auto 99.4%)",
  lastSyncTimestamp: new Date().toISOString(),
};

const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "audit-01",
    type: "[TRANSCRIPTION_DISPATCH]",
    description: "Usuario Andrey Quiceno inició transcripción local (Hash: 9b2d8...f3a). Audio 48m, Códec AAC.",
    user: "Andrey Quiceno",
    hash: "9b2d86a41e97f3a09c21",
    timestamp: "14:22:08",
    severity: "info",
  },
  {
    id: "audit-02",
    type: "[NODE_BALANCER]",
    description: "Nodo GPU-02 asignado a Dra. Valeria Restrepo. VRAM asignada: 3.2 GB. Whisper Local Enterprise v2.",
    user: "System Daemon",
    hash: "4c71e89b21aa65f4d890",
    timestamp: "13:54:19",
    severity: "info",
  },
  {
    id: "audit-03",
    type: "[QUOTA_EXCEEDED_WARNING]",
    description: "Mariana Hoyos superó el 95% de su cuota mensual asignada (1,980/2,000 min). Notificación disparada.",
    user: "Mariana Hoyos",
    hash: "7fa012c89dbef4516782",
    timestamp: "11:15:02",
    severity: "warn",
  },
  {
    id: "audit-04",
    type: "[CONFIG_UPDATE]",
    description: "Parámetros de inferencia CUDA sincronizados exitosamente con socket IPC de ClustLayer.",
    user: "Andrey Quiceno",
    hash: "e8c74a0094182902ff91",
    timestamp: "09:41:22",
    severity: "info",
  },
];

// LocalStorage helpers
function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`voznotai_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`voznotai_${key}`, JSON.stringify(val));
  } catch (err) {
    console.error("Storage error:", err);
  }
}

// Reactive store event dispatching
const STORE_EVENT = "voznotai_store_update";

function notifyUpdate() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

// Custom hook to subscribe to reactive store
export function useVozNotStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handle = () => setTick((t) => t + 1);
    window.addEventListener(STORE_EVENT, handle);
    return () => window.removeEventListener(STORE_EVENT, handle);
  }, []);

  const currentUser = loadStorage<User>("currentUser", INITIAL_USERS[0]);
  const users = loadStorage<User[]>("users", INITIAL_USERS);
  const sessions = loadStorage<AudioSession[]>("sessions", INITIAL_SESSIONS);
  const activeSessionId = loadStorage<string>("activeSessionId", INITIAL_SESSIONS[0].id);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const notes = loadStorage<SmartNote[]>("notes", INITIAL_NOTES);
  const settings = loadStorage<SystemSettings>("settings", INITIAL_SETTINGS);
  const auditLogs = loadStorage<AuditEvent[]>("auditLogs", INITIAL_AUDIT_LOGS);

  // Authentication actions
  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      saveStorage("currentUser", target);
      notifyUpdate();
    }
  };

  const updateUser = (updated: Partial<User>) => {
    const newCurrent = { ...currentUser, ...updated };
    saveStorage("currentUser", newCurrent);
    const updatedUsers = users.map((u) => (u.id === newCurrent.id ? newCurrent : u));
    saveStorage("users", updatedUsers);
    notifyUpdate();
  };

  // Sessions actions
  const selectSession = (sessionId: string) => {
    saveStorage("activeSessionId", sessionId);
    notifyUpdate();
  };

  const addSession = (session: AudioSession) => {
    const newSessions = [session, ...sessions];
    saveStorage("sessions", newSessions);
    saveStorage("activeSessionId", session.id);
    notifyUpdate();
  };

  const updateSession = (sessionId: string, updates: Partial<AudioSession>) => {
    const updated = sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s));
    saveStorage("sessions", updated);
    notifyUpdate();
  };

  const deleteSession = (sessionId: string) => {
    const filtered = sessions.filter((s) => s.id !== sessionId);
    saveStorage("sessions", filtered);
    if (activeSessionId === sessionId && filtered.length > 0) {
      saveStorage("activeSessionId", filtered[0].id);
    }
    notifyUpdate();
  };

  // Notes actions
  const addNote = (note: Omit<SmartNote, "id" | "createdAt">) => {
    const newNote: SmartNote = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: "Hoy, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updatedNotes = [newNote, ...notes];
    saveStorage("notes", updatedNotes);
    // increment notes count on the session
    const targetSession = sessions.find((s) => s.id === note.sessionId);
    if (targetSession) {
      updateSession(targetSession.id, { notesCount: (targetSession.notesCount || 0) + 1 });
    }
    notifyUpdate();
  };

  const deleteNote = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    saveStorage("notes", updatedNotes);
    if (target) {
      const sess = sessions.find((s) => s.id === target.sessionId);
      if (sess && sess.notesCount > 0) {
        updateSession(sess.id, { notesCount: sess.notesCount - 1 });
      }
    }
    notifyUpdate();
  };

  // Settings actions
  const updateSettings = (updates: Partial<SystemSettings>) => {
    const newSettings = { ...settings, ...updates, lastSyncTimestamp: new Date().toISOString() };
    saveStorage("settings", newSettings);
    // Add audit log
    const audit: AuditEvent = {
      id: `audit-${Date.now()}`,
      type: "[CONFIG_UPDATE]",
      description: `Parámetros modificados por ${currentUser.name} ${currentUser.lastName}. Modo: ${newSettings.executionMode}, Modelo: ${newSettings.localModelName}`,
      user: `${currentUser.name} ${currentUser.lastName}`,
      hash: Math.random().toString(16).substring(2, 18),
      timestamp: new Date().toTimeString().split(" ")[0],
      severity: "info",
    };
    saveStorage("auditLogs", [audit, ...auditLogs]);
    notifyUpdate();
  };

  // Restore defaults
  const restoreSettingsDefaults = () => {
    saveStorage("settings", INITIAL_SETTINGS);
    notifyUpdate();
  };

  // Add custom audit event
  const addAuditEvent = (event: Omit<AuditEvent, "id" | "timestamp">) => {
    const newEv: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
    };
    saveStorage("auditLogs", [newEv, ...auditLogs]);
    notifyUpdate();
  };

  return {
    currentUser,
    users,
    sessions,
    activeSession,
    notes,
    settings,
    auditLogs,
    switchUser,
    updateUser,
    selectSession,
    addSession,
    updateSession,
    deleteSession,
    addNote,
    deleteNote,
    updateSettings,
    restoreSettingsDefaults,
    addAuditEvent,
  };
}
