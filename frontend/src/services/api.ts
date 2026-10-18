/**
 * Real API client for VozNotAI FastAPI Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    // Memory only. The session cookie is HttpOnly; the token is not written to localStorage.
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Send and receive HttpOnly cookies
    });

    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.detail?.message ||
        data?.message ||
        `Error HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg) as Error & { status: number; code: string };
      err.status = response.status;
      err.code = data?.detail?.code || data?.code || "HTTP_ERROR";
      throw err;
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  async login(email: string, password: string) {
    const res = await this.request<{
      access_token: string;
      user: Record<string, unknown>;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const res = await this.request<{
      access_token: string;
      user: Record<string, unknown>;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.setToken(null);
    }
  }

  async getProfile() {
    return this.request<Record<string, unknown>>("/auth/me");
  }

  async updateProfile(updates: Record<string, unknown>) {
    return this.request<Record<string, unknown>>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async requestPasswordRecovery(email: string) {
    return this.request<{ message: string; dev_reset_token?: string }>(
      "/auth/password-recovery",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  }

  async confirmPasswordReset(token: string, new_password: string) {
    return this.request<{ message: string }>("/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  }

  // --- Conversations Endpoints ---
  async listConversations(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request<Array<Record<string, unknown>>>(`/conversations${q}`);
  }

  async createConversation(title: string) {
    return this.request<Record<string, unknown>>("/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  async getConversationDetail(id: string) {
    return this.request<Record<string, unknown>>(`/conversations/${id}`);
  }

  async updateConversationTitle(id: string, title: string) {
    return this.request<Record<string, unknown>>(`/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(id: string) {
    return this.request<void>(`/conversations/${id}`, {
      method: "DELETE",
    });
  }

  async sendConversationMessage(id: string, content: string) {
    return this.request<Record<string, unknown>>(`/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, message_type: "text" }),
    });
  }

  // --- Transcriptions Endpoints ---
  async uploadAudioAndTranscribe(
    file: File,
    conversationId?: string,
    language?: string
  ) {
    const formData = new FormData();
    formData.append("file", file);
    if (conversationId) formData.append("conversation_id", conversationId);
    if (language) formData.append("language", language);

    return this.request<{
      transcription: Record<string, unknown>;
      conversation_id: string;
      conversation_title: string;
    }>("/transcriptions/upload", {
      method: "POST",
      body: formData,
    });
  }

  async listTranscriptions(conversationId?: string) {
    const q = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : "";
    return this.request<Array<Record<string, unknown>>>(`/transcriptions${q}`);
  }

  async getTranscription(id: string) {
    return this.request<Record<string, unknown>>(`/transcriptions/${id}`);
  }

  getAudioStreamUrl(transcriptionId: string): string {
    return `${API_BASE_URL}/transcriptions/${transcriptionId}/audio`;
  }

  // --- Notes Endpoints ---
  async listNotes(params?: {
    conversation_id?: string;
    category?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.conversation_id) searchParams.set("conversation_id", params.conversation_id);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request<Array<Record<string, unknown>>>(`/notes${qs}`);
  }

  async createNote(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
    conversation_id?: string;
    transcription_id?: string;
    segment_start?: number;
    segment_end?: number;
  }) {
    return this.request<Record<string, unknown>>("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string) {
    return this.request<void>(`/notes/${id}`, {
      method: "DELETE",
    });
  }

  // --- Usage Endpoints ---
  async getUsageSummary() {
    return this.request<Record<string, unknown>>("/usage/summary");
  }

  async getUsageEvents(limit: number = 50) {
    return this.request<Array<Record<string, unknown>>>(`/usage/events?limit=${limit}`);
  }

  // --- System & Settings Endpoints ---
  async getSystemSettings() {
    return this.request<Record<string, unknown>>("/settings");
  }

  async updateSystemSettings(settingsUpdate: Record<string, unknown>) {
    return this.request<Record<string, unknown>>("/settings", {
      method: "PUT",
      body: JSON.stringify(settingsUpdate),
    });
  }

  async getSystemStatus() {
    return this.request<Record<string, unknown>>("/system/status");
  }

  async getSystemHealth() {
    return this.request<Record<string, unknown>>("/system/health");
  }

  // --- Admin Endpoints ---
  async getAdminDashboard() {
    return this.request<Record<string, unknown>>("/admin/dashboard");
  }

  async listAdminUsers(search?: string, role?: string, is_active?: boolean) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (role) sp.set("role", role);
    if (is_active !== undefined) sp.set("is_active", String(is_active));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return this.request<{ users: Array<Record<string, unknown>>; total: number }>(
      `/admin/users${qs}`
    );
  }

  async updateAdminUser(userId: string, data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async listAuditLogs(limit: number = 50) {
    return this.request<Array<Record<string, unknown>>>(`/admin/audit?limit=${limit}`);
  }
}

export const api = new ApiClient();
