import React, { useEffect, useId, useMemo, useRef, useState } from "react";

// PUBLIC_INTERFACE
function NoteForm({
  mode,
  initialTitle,
  initialContent,
  onSubmit,
  onCancel,
}) {
  const titleId = useId();
  const contentId = useId();
  const errorId = useId();

  const titleInputRef = useRef(null);

  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [touched, setTouched] = useState(false);

  // Keep form in sync when switching between create/edit.
  useEffect(() => {
    setTitle(initialTitle || "");
    setContent(initialContent || "");
    setTouched(false);

    // Focus title for quick keyboard entry when switching to edit.
    if (titleInputRef.current) titleInputRef.current.focus();
  }, [initialTitle, initialContent, mode]);

  const titleError = useMemo(() => {
    if (!touched) return "";
    if (!title.trim()) return "Title is required.";
    return "";
  }, [title, touched]);

  const isValid = title.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);

    if (!isValid) {
      if (titleInputRef.current) titleInputRef.current.focus();
      return;
    }

    onSubmit({ title, content });

    // Reset only in create mode.
    if (mode === "create") {
      setTitle("");
      setContent("");
      setTouched(false);
      if (titleInputRef.current) titleInputRef.current.focus();
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor={titleId}>
          Title <span className="required" aria-hidden="true">*</span>
        </label>
        <input
          ref={titleInputRef}
          id={titleId}
          name="title"
          type="text"
          className={`input ${titleError ? "inputError" : ""}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched(true)}
          required
          aria-required="true"
          aria-invalid={titleError ? "true" : "false"}
          aria-describedby={titleError ? errorId : undefined}
          placeholder="e.g., Grocery list"
          autoComplete="off"
        />
        {titleError ? (
          <div className="error" id={errorId} role="alert">
            {titleError}
          </div>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor={contentId}>
          Content
        </label>
        <textarea
          id={contentId}
          name="content"
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
          rows={5}
        />
      </div>

      <div className="actions">
        <button type="submit" className="btn btnPrimary">
          {mode === "edit" ? "Save changes" : "Add note"}
        </button>

        {mode === "edit" && onCancel ? (
          <button type="button" className="btn btnGhost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default NoteForm;
