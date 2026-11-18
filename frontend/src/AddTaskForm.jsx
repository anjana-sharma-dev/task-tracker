import { useState } from "react";
import { createTask } from "./api";
import { useToast } from "./Toast";

export default function AddTaskForm({ projectId, onAdded }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await createTask(projectId, {
        title: title.trim(),
        priority,
        due_date: dueDate || null,
      });
      setTitle("");
      setDueDate("");
      setPriority("medium");
      addToast("Task added successfully!", "success");
      onAdded();
    } catch (err) {
      addToast(err.message || "Failed to create task", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="quick-add-form">
      <div className="quick-add-input-wrapper">
        <svg
          className="quick-add-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done? Press Enter to add..."
          disabled={isSubmitting}
        />
      </div>

      <div className="quick-add-controls">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          disabled={isSubmitting}
          className="quick-select"
        >
          <option value="low">🟢 Low Priority</option>
          <option value="medium">🟡 Medium Priority</option>
          <option value="high">🔴 High Priority</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="quick-date"
          title="Due date (optional)"
          disabled={isSubmitting}
        />

        <button type="submit" disabled={!title.trim() || isSubmitting} className="btn-primary">
          {isSubmitting ? "Adding..." : "+ Add Task"}
        </button>
      </div>
    </form>
  );
}
