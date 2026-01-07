import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";

/**
 * Small helper to generate stable-ish ids without extra dependencies.
 * (Not cryptographically secure; fine for local UI state.)
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
  /**
   * Note: keeping state local for now as requested.
   * API integration will be added in the next step.
   */
  const [notes, setNotes] = useState(() => SEED_NOTES);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Enforce light theme for this UI.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const editingNote = useMemo(
    () => notes.find((n) => n.id === editingId) || null,
    [notes, editingId]
  );

  const clearStatusSoon = () => {
    window.clearTimeout(clearStatusSoon._t);
    clearStatusSoon._t = window.setTimeout(() => setStatusMessage(""), 2500);
  };

  const handleCreate = ({ title, content }) => {
    const nowIso = new Date().toISOString();
    const newNote = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      updatedAt: nowIso,
    };

    setNotes((prev) => [newNote, ...prev]);
    setStatusMessage("Note added.");
    clearStatusSoon();
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

  const handleUpdate = ({ title, content }) => {
    if (!editingId) return;

    const nowIso = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === editingId
          ? {
              ...n,
              title: title.trim(),
              content: content.trim(),
              updatedAt: nowIso,
            }
          : n
      )
    );

    setEditingId(null);
    setStatusMessage("Note updated.");
    clearStatusSoon();
  };

  const handleDelete = (id) => {
    const note = notes.find((n) => n.id === id);
    const ok = window.confirm(
      `Delete "${note?.title ?? "this note"}"? This cannot be undone.`
    );
    if (!ok) return;

    setNotes((prev) => prev.filter((n) => n.id !== id));

    if (editingId === id) setEditingId(null);

    setStatusMessage("Note deleted.");
    clearStatusSoon();
  };

  return (
    <div className="App">
      <Header />

      <main className="page" aria-label="Notes app">
        <section className="panel" aria-label="Create or edit note">
          <div className="panelHeader">
            <h2 className="panelTitle">
              {editingNote ? "Edit note" : "Add a note"}
            </h2>
            <p className="panelSubtitle">
              Title is required. Content is optional.
            </p>
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
                {notes.length === 0
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
          Notes UI (local state). API integration will be added next.
        </small>
      </footer>
    </div>
  );
}

export default App;
