const STORAGE_KEY = "kavia.notes.mock.v1";

/**
 * Normalize notes coming from different sources:
 * - backend may omit updatedAt
 * - mock always stores updatedAt
 */
function normalizeNote(note) {
  const nowIso = new Date().toISOString();
  return {
    id: String(note.id),
    title: String(note.title ?? ""),
    content: String(note.content ?? ""),
    updatedAt: note.updatedAt ? String(note.updatedAt) : nowIso,
  };
}

function getFeatureFlags() {
  const raw = (process.env.REACT_APP_FEATURE_FLAGS || "").trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toUpperCase())
  );
}

function isMockForced() {
  return getFeatureFlags().has("MOCK_API");
}

function getBaseUrl() {
  const base =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "")
      .trim()
      .replace(/\/+$/, "");
  return base;
}

function buildUrl(pathname) {
  const base = getBaseUrl();
  // If no base is provided, keep it relative (useful for local dev proxies).
  if (!base) return pathname;
  return `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isNetworkError(err) {
  // fetch throws TypeError on network errors in browsers.
  return err instanceof TypeError;
}

/* -----------------------
 * Mock storage utilities
 * ----------------------*/
function loadMockNotes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNote);
  } catch {
    return [];
  }
}

function saveMockNotes(notes) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function mockGenerateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function mockList() {
  return loadMockNotes().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function mockCreate({ title, content }) {
  const nowIso = new Date().toISOString();
  const newNote = normalizeNote({
    id: mockGenerateId(),
    title: title?.trim?.() ?? String(title ?? "").trim(),
    content: content?.trim?.() ?? String(content ?? "").trim(),
    updatedAt: nowIso,
  });
  const existing = loadMockNotes();
  const next = [newNote, ...existing];
  saveMockNotes(next);
  return newNote;
}

async function mockUpdate(id, { title, content }) {
  const nowIso = new Date().toISOString();
  const existing = loadMockNotes();
  const idx = existing.findIndex((n) => String(n.id) === String(id));
  if (idx === -1) {
    // Create-on-update is sometimes convenient for mock; but keep behavior strict:
    // mimic backend 404 by throwing.
    const err = new Error("Mock note not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updated = normalizeNote({
    ...existing[idx],
    title: title?.trim?.() ?? String(title ?? "").trim(),
    content: content?.trim?.() ?? String(content ?? "").trim(),
    updatedAt: nowIso,
  });

  const next = [...existing];
  next[idx] = updated;
  saveMockNotes(next);
  return updated;
}

async function mockDelete(id) {
  const existing = loadMockNotes();
  const next = existing.filter((n) => String(n.id) !== String(id));
  saveMockNotes(next);
}

/* -----------------------
 * Backend API utilities
 * ----------------------*/
async function requestJson(path, options = {}) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await parseJsonSafe(res);
    const message =
      (body && (body.message || body.error)) ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  const data = await parseJsonSafe(res);
  return data;
}

/**
 * Attempt a backend call; if it fails due to network/unreachable issues,
 * fall back to mock. If MOCK_API is enabled, always use mock.
 */
async function withFallback(backendFn, mockFn) {
  if (isMockForced()) return mockFn();

  try {
    return await backendFn();
  } catch (err) {
    // Only fall back for network failures or when the server is unreachable.
    // If server returned an error response (status present), surface it.
    if (err && typeof err === "object" && "status" in err) throw err;
    if (isNetworkError(err)) return mockFn();
    // Some environments might throw non-TypeError fetch errors; be safe:
    return mockFn();
  }
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** List notes from backend, falling back to localStorage mock. */
  return withFallback(
    async () => {
      const data = await requestJson("/api/notes", { method: "GET" });
      const list = Array.isArray(data) ? data : data?.notes;
      if (!Array.isArray(list)) return [];
      return list.map(normalizeNote).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async () => mockList()
  );
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a note in backend, falling back to localStorage mock. */
  return withFallback(
    async () => {
      const data = await requestJson("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      return normalizeNote(data?.note ?? data);
    },
    async () => mockCreate({ title, content })
  );
}

// PUBLIC_INTERFACE
export async function updateNote(id, { title, content }) {
  /** Update a note in backend, falling back to localStorage mock. */
  return withFallback(
    async () => {
      const data = await requestJson(`/api/notes/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ title, content }),
      });
      return normalizeNote(data?.note ?? data);
    },
    async () => mockUpdate(id, { title, content })
  );
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note in backend, falling back to localStorage mock. */
  return withFallback(
    async () => {
      await requestJson(`/api/notes/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    async () => mockDelete(id)
  );
}

// PUBLIC_INTERFACE
export function getNotesApiMode() {
  /** Returns "mock" when mock is forced via feature flag; otherwise "auto". */
  return isMockForced() ? "mock" : "auto";
}
