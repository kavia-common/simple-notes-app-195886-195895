import React, { useMemo } from "react";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// PUBLIC_INTERFACE
function NoteItem({ note, isEditing, onEdit, onDelete }) {
  const updatedText = useMemo(() => formatDate(note.updatedAt), [note.updatedAt]);

  return (
    <li className={`noteCard ${isEditing ? "noteCardActive" : ""}`}>
      <div className="noteTop">
        <div className="noteMain">
          <h3 className="noteTitle">
            {note.title}
            {isEditing ? <span className="badge">Editing</span> : null}
          </h3>

          {note.content ? (
            <p className="noteContent">{note.content}</p>
          ) : (
            <p className="noteContent noteContentMuted">No content.</p>
          )}
        </div>

        <div className="noteActions" aria-label={`Actions for ${note.title}`}>
          <button type="button" className="btn btnSuccess" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn btnDanger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {updatedText ? (
        <div className="noteMeta">Last updated: {updatedText}</div>
      ) : null}
    </li>
  );
}

export default NoteItem;
