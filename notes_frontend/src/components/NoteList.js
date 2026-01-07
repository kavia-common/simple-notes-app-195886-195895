import React from "react";
import NoteItem from "./NoteItem";

// PUBLIC_INTERFACE
function NoteList({ notes, editingId, onEdit, onDelete }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="emptyState" role="status" aria-live="polite">
        <div className="emptyTitle">No notes</div>
        <div className="emptyText">Add your first note using the form.</div>
      </div>
    );
  }

  return (
    <ul className="noteList" aria-label="Notes">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          isEditing={note.id === editingId}
          onEdit={() => onEdit(note.id)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </ul>
  );
}

export default NoteList;
