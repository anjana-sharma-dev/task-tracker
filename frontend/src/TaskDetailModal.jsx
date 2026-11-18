import { useState, useEffect } from "react";
import { updateTask, deleteTask, getComments, createComment } from "./api";
import { useToast } from "./Toast";

export default function TaskDetailModal({ task, users, isOwner, onClose, onUpdated }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);

  const { addToast } = useToast();

  const today = new Date().toLocaleDateString("en-CA");
  const isOverdue = dueDate && dueDate < today && status !== "done";

  useEffect(() => {
    loadComments();
  }, [task.id]);

  async function loadComments() {
    try {
      setLoadingComments(true);
      const data = await getComments(task.id);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleSaveField(changes) {
    try {
      setIsSaving(true);
      await updateTask(task.id, changes);
      addToast("Changes saved!", "success");
      onUpdated();
    } catch (err) {
      addToast(err.message || "Failed to update task", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await createComment(task.id, { content: newComment });
      setNewComment("");
      addToast("Comment posted", "success");
      await loadComments();
    } catch (err) {
      addToast(err.message || "Failed to post comment", "error");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(task.id);
      addToast("Task deleted", "info");
      onUpdated();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to delete task", "error");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-task-id">#{task.id}</span>
            <span className={`priority-pill priority-${priority}`}>
              {priority}
            </span>
            {isOverdue && (
              <span className="overdue-pill">⚠️ Overdue</span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-body">
          {/* Main Content: Title, Description, Comments */}
          <div className="modal-main-col">
            <input
              className="modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== task.title) {
                  handleSaveField({ title });
                }
              }}
              placeholder="Task title..."
            />

            <div className="modal-section">
              <label className="modal-section-label">Description</label>
              <textarea
                className="modal-desc-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== (task.description || "")) {
                    handleSaveField({ description: description || null });
                  }
                }}
                placeholder="Add a detailed description for this task..."
              />
            </div>

            {/* Comments Thread */}
            <div className="modal-section comments-section">
              <label className="modal-section-label">
                Comments ({comments.length})
              </label>

              <form onSubmit={handleAddComment} className="comment-form">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={!newComment.trim()}>
                  Post
                </button>
              </form>

              <div className="comments-list">
                {loadingComments ? (
                  <p className="subtle-text">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="subtle-text">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="comment-bubble">
                      <div className="comment-avatar">
                        {c.user?.name ? c.user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="comment-content">
                        <div className="comment-meta">
                          <span className="comment-author">{c.user?.name ?? "User"}</span>
                          <span className="comment-time">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="comment-text">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Properties */}
          <div className="modal-side-col">
            <div className="property-group">
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  handleSaveField({ status: e.target.value });
                }}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="property-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSaveField({ priority: e.target.value });
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="property-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setDueDate(e.target.value);
                  handleSaveField({ due_date: val });
                }}
              />
            </div>

            <div className="property-group">
              <label>Assignee</label>
              {isOwner ? (
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setAssigneeId(e.target.value);
                    handleSaveField({ assignee_id: val });
                  }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="property-readonly">
                  {users.find((u) => u.id === task.assignee_id)?.name ?? "Unassigned"}
                </div>
              )}
            </div>

            {isOwner && (
              <div className="property-group danger-zone">
                <button className="btn-danger" onClick={handleDelete}>
                  🗑️ Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
