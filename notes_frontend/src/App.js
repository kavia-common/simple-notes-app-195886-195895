import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import {
  createNote,
  deleteNote,
  getNotesApiMode,
  listNotes,
  updateNote,
} from "./api/notes";

const SEED_NOTES = [
  {
    id: "seed-1",
    title: "Welcome to Notes",
    content:
      "Add a new note, edit an existing one, or delete notes you no longer need.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "Keyboard tips",
    content:
      "Use Tab to move between controls. Press Enter on buttons/links to activate them.",
    updatedAt: new Date().toISOString(),
  },
];

// PUBLIC_INTERFACE
function App() {
  const [notes, setNotes] = useState(() => []);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Enforce light theme for this UI.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Initial load from API (auto-falls back to mock). If both are empty, show seeds.
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const loaded = await listNotes();
        if (isCancelled) return;

        if (loaded.length === 0) {
          // First run UX: show seeds by creating them through API layer so
          // they persist in mock storage (and in backend if available).
          const created = [];
          for (const seed of SEED_NOTES) {
            // Keep seed updatedAt if backend supports it? Our API does not send it.
            // We'll create with title/content; updatedAt will be set by backend/mock.
            // eslint-disable-next-line no-await-in-loop
            const c = await createNote({
              title: seed.title,
              content: seed.content,
            });
            created.push(c);
          }
          setNotes(created);
        } else {
          setNotes(loaded);
        }

        const apiMode = getNotesApiMode();
        setStatusMessage(
          apiMode === "mock"
            ? "Mock mode enabled (localStorage)."
            : "Notes loaded."
        );
      } catch (err) {
        if (isCancelled) return;
        // If backend returns a non-network error and mock wasn't used, show seeds locally.
        setNotes(SEED_NOTES);
        setStatusMessage("Unable to load notes. Showing defaults.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const editingNote = useMemo(
    () => notes.find((n) => n.id === editingId) || null,
    [notes, editingId]
  );

  const clearStatusSoon = () => {
    window.clearTimeout(clearStatusSoon._t);
    clearStatusSoon._t = window.setTimeout(() => setStatusMessage(""), 2500);
  };

  const handleCreate = async ({ title, content }) => {
    try {
      const created = await createNote({ title, content });
      setNotes((prev) => [created, ...prev]);
      setStatusMessage("Note added.");
    } catch (err) {
      setStatusMessage("Could not add note. Please try again.");
    } finally {
      clearStatusSoon();
    }
  };

  const handleStartEdit = (id) => {
    setEditingId(id);
    setStatusMessage("Editing note.");
    clearStatusSoon();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setStatusMessage("Edit cancelled.");
    clearStatusSoon();
  };

  const handleUpdate = async ({ title, content }) => {
    if (!editingId) return;

    try {
      const updated = await updateNote(editingId, { title, content });
      setNotes((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
      setEditingId(null);
      setStatusMessage("Note updated.");
    } catch (err) {
      setStatusMessage("Could not update note. Please try again.");
    } finally {
      clearStatusSoon();
    }
  };

  const handleDelete = async (id) => {
    const note = notes.find((n) => n.id === id);
    const ok = window.confirm(
      `Delete "${note?.title ?? "this note"}"? This cannot be undone.`
    );
    if (!ok) return;

    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
      setStatusMessage("Note deleted.");
    } catch (err) {
      setStatusMessage("Could not delete note. Please try again.");
    } finally {
      clearStatusSoon();
    }
  };

  return (
    <div className="App">
      <Header />

      <main className="page" aria-label="Notes app">
        <section className="panel" aria-label="Create or edit note">
          <div className="panelHeader">
            <h2 className="panelTitle">{editingNote ? "Edit note" : "Add a note"}</h2>
            <p className="panelSubtitle">Title is required. Content is optional.</p>
          </div>

          <NoteForm
            mode={editingNote ? "edit" : "create"}
            initialTitle={editingNote?.title ?? ""}
            initialContent={editingNote?.content ?? ""}
            onSubmit={editingNote ? handleUpdate : handleCreate}
            onCancel={editingNote ? handleCancelEdit : undefined}
          />

          <div className="srOnly" aria-live="polite" aria-atomic="true">
            {statusMessage}
          </div>
        </section>

        <section className="panel" aria-label="Notes list">
          <div className="panelHeader panelHeaderRow">
            <div>
              <h2 className="panelTitle">Your notes</h2>
              <p className="panelSubtitle">
                {isLoading
                  ? "Loading..."
                  : notes.length === 0
                    ? "No notes yet. Add one above."
                    : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {editingNote ? (
              <button
                type="button"
                className="btn btnGhost"
                onClick={handleCancelEdit}
              >
                Exit edit
              </button>
            ) : null}
          </div>

          <NoteList
            notes={notes}
            editingId={editingId}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer className="footer">
        <small className="footerText">
          API mode: {getNotesApiMode()} (auto falls back to localStorage mock when
          backend is unreachable). Configure base URL via REACT_APP_API_BASE (or
          REACT_APP_BACKEND_URL). Force mock via REACT_APP_FEATURE_FLAGS=MOCK_API.
        </small>
      </footer>
    </div>
  );
}

export default App;
