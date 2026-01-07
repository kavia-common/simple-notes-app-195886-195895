import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

jest.mock("./api/notes", () => {
  return {
    __esModule: true,
    listNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    getNotesApiMode: jest.fn(),
  };
});

const api = require("./api/notes");

beforeEach(() => {
  jest.clearAllMocks();
  api.getNotesApiMode.mockReturnValue("auto");
  api.listNotes.mockResolvedValue([
    {
      id: "n1",
      title: "First",
      content: "Hello",
      updatedAt: new Date().toISOString(),
    },
  ]);
});

test("renders Notes header", async () => {
  render(<App />);
  const heading = await screen.findByRole("heading", { name: "Notes" });
  expect(heading).toBeInTheDocument();
});

test("creates a note via API layer", async () => {
  const user = userEvent.setup();
  api.createNote.mockResolvedValue({
    id: "n2",
    title: "New title",
    content: "New content",
    updatedAt: new Date().toISOString(),
  });

  render(<App />);

  // Wait for initial load
  await screen.findByText(/1 note/i);

  await user.type(screen.getByLabelText(/title/i), "New title");
  await user.type(screen.getByLabelText(/content/i), "New content");
  await user.click(screen.getByRole("button", { name: /add note/i }));

  await waitFor(() =>
    expect(api.createNote).toHaveBeenCalledWith({
      title: "New title",
      content: "New content",
    })
  );

  expect(await screen.findByText("New title")).toBeInTheDocument();
});

test("updates a note via API layer", async () => {
  const user = userEvent.setup();
  api.updateNote.mockResolvedValue({
    id: "n1",
    title: "First (edited)",
    content: "Hello",
    updatedAt: new Date().toISOString(),
  });

  render(<App />);

  await screen.findByText("First");

  await user.click(screen.getAllByRole("button", { name: /edit/i })[0]);
  await user.clear(screen.getByLabelText(/title/i));
  await user.type(screen.getByLabelText(/title/i), "First (edited)");
  await user.click(screen.getByRole("button", { name: /save changes/i }));

  await waitFor(() =>
    expect(api.updateNote).toHaveBeenCalledWith("n1", {
      title: "First (edited)",
      content: "Hello",
    })
  );

  expect(await screen.findByText("First (edited)")).toBeInTheDocument();
});

test("deletes a note via API layer", async () => {
  const user = userEvent.setup();
  api.deleteNote.mockResolvedValue(undefined);
  jest.spyOn(window, "confirm").mockReturnValue(true);

  render(<App />);
  await screen.findByText("First");

  await user.click(screen.getAllByRole("button", { name: /delete/i })[0]);

  await waitFor(() => expect(api.deleteNote).toHaveBeenCalledWith("n1"));
  await waitFor(() => expect(screen.queryByText("First")).not.toBeInTheDocument());

  window.confirm.mockRestore();
});
