import { useCallback, useEffect, useState } from "react";
import { getTasks, updateTask, getUsers, createTask } from "./api";
import TaskCard from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";
import { useToast } from "./Toast";
import "./Board.css";

const COLUMNS = [
  { key: "todo", title: "Todo", accent: "#64748b" },
  { key: "in_progress", title: "In Progress", accent: "#f59e0b" },
  { key: "done", title: "Done", accent: "#10b981" },
];

export default function Board({ projectId, project, isOwner }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [viewMode, setViewMode] = useState("board"); // 'board' or 'list'
  const [activeMobileCol, setActiveMobileCol] = useState("todo"); // 'todo', 'in_progress', 'done'

  // Inline column add state
  const [addingToCol, setAddingToCol] = useState(null);
  const [colTaskTitle, setColTaskTitle] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterOverdue, setFilterOverdue] = useState(false);

  const { addToast } = useToast();

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      const data = await getTasks(projectId);
      setTasks(data);
      setSelectedTask((prev) => (prev ? data.find((t) => t.id === prev.id) || null : null));
    } catch (e) {
      setError(e.message);
      addToast(e.message, "error");
    }
  }, [projectId, addToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    getUsers().then(setUsers).catch((e) => console.error(e));
  }, []);

  async function handleStatusChange(taskId, newStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(taskId, { status: newStatus });
      addToast(`Task moved to ${newStatus.replace("_", " ")}`, "success");
      loadTasks();
    } catch (err) {
      addToast(err.message, "error");
      loadTasks();
    }
  }

  async function handleInlineAdd(colKey) {
    if (!colTaskTitle.trim()) {
      setAddingToCol(null);
      return;
    }
    try {
      await createTask(projectId, {
        title: colTaskTitle.trim(),
        status: colKey,
        priority: "medium",
      });
      setColTaskTitle("");
      setAddingToCol(null);
      addToast("Task created!", "success");
      loadTasks();
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  // Drag and Drop
  function handleDragOver(e, colKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  }

  function handleDragLeave(e, colKey) {
    if (dragOverCol === colKey) {
      setDragOverCol(null);
    }
  }

  function handleDrop(e, colKey) {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData("application/task-id");
    if (!taskIdStr) return;
    handleStatusChange(Number(taskIdStr), colKey);
  }

  // Filter Logic
  const today = new Date().toLocaleDateString("en-CA");
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      filterPriority === "all" || t.priority === filterPriority;

    const matchesOverdue =
      !filterOverdue || (t.due_date && t.due_date < today && t.status !== "done");

    return matchesSearch && matchesPriority && matchesOverdue;
  });

  const hasActiveFilters =
    searchQuery.trim() !== "" || filterPriority !== "all" || filterOverdue;

  function clearAllFilters() {
    setSearchQuery("");
    setFilterPriority("all");
    setFilterOverdue(false);
  }

  if (error) {
    return (
      <div className="board-error">
        <p>⚠️ {error}</p>
        <button onClick={loadTasks} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="board-page-wrapper">
      {/* Sleek Header Section */}
      <div className="board-header-section">
        <div className="header-meta">
          <div className="title-row">
            <h1>{project?.name || "Task Board"}</h1>
            <span className="project-type-chip">
              {isOwner ? "👑 Admin Access" : "👥 Team Member"}
            </span>
            {project?.description && (
              <span className="project-desc-tag">{project.description}</span>
            )}
          </div>
        </div>

        {/* View Switcher & Stats */}
        <div className="header-controls">
          <div className="view-toggle-bar">
            <button
              className={`view-btn ${viewMode === "board" ? "active" : ""}`}
              onClick={() => setViewMode("board")}
              title="Kanban Board View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1"></rect>
                <rect x="14" y="3" width="7" height="18" rx="1"></rect>
              </svg>
              <span>Board</span>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Table / List View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>List</span>
            </button>
          </div>

          <div className="board-metrics">
            <span className="metric-badge">
              <strong>{tasks.length}</strong> Tasks
            </span>
            <span className="metric-badge metric-done">
              <strong>{tasks.filter((t) => t.status === "done").length}</strong> Done
            </span>
          </div>
        </div>
      </div>

      {/* Clean Unified Filters Toolbar */}
      <div className="board-toolbar-card">
        <div className="search-field">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filters-row">
          <div className="priority-filter-tabs">
            {["all", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                className={`tab-btn ${filterPriority === p ? "active" : ""}`}
                onClick={() => setFilterPriority(p)}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <button
            className={`filter-chip ${filterOverdue ? "chip-active" : ""}`}
            onClick={() => setFilterOverdue(!filterOverdue)}
            title="Toggle overdue tasks"
          >
            {filterOverdue ? "✓ Overdue: ON" : "⚠️ Overdue Only"}
          </button>

          {hasActiveFilters && (
            <div className="active-filters-group">
              <span className="filter-count-badge">
                Showing {filteredTasks.length} of {tasks.length}
              </span>
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Reset Filters ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Column Switcher (Visible ONLY on mobile <= 768px in Board view) */}
      {viewMode === "board" && (
        <div className="mobile-column-tabs">
          {COLUMNS.map((col) => {
            const count = filteredTasks.filter((t) => t.status === col.key).length;
            const isActive = activeMobileCol === col.key;
            return (
              <button
                key={col.key}
                className={`mobile-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveMobileCol(col.key)}
              >
                <span className="mobile-tab-dot" style={{ backgroundColor: col.accent }}></span>
                <span>{col.title}</span>
                <span className="mobile-tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* View Content: Kanban vs List */}
      {viewMode === "board" ? (
        <div className="kanban-scroll-container">
          <div className="kanban-board-layout">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.key);
              const isDropActive = dragOverCol === col.key;
              const isMobileActive = activeMobileCol === col.key;

              return (
                <div
                  key={col.key}
                  className={`board-column col-${col.key} ${isDropActive ? "drag-over" : ""} ${isMobileActive ? "mobile-column-visible" : "mobile-column-hidden"}`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={(e) => handleDragLeave(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column Header */}
                  <div className="column-top">
                    <div className="col-title-group">
                      <span className="status-indicator" style={{ backgroundColor: col.accent }}></span>
                      <h3>{col.title}</h3>
                    </div>
                    <span className="col-count-pill">{colTasks.length}</span>
                  </div>

                  {/* Task List */}
                  <div className="column-tasks">
                    {colTasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        users={users}
                        isOwner={isOwner}
                        onClick={() => setSelectedTask(t)}
                        onStatusChange={(newStatus) => handleStatusChange(t.id, newStatus)}
                      />
                    ))}

                    {colTasks.length === 0 && (
                      <div className="empty-drop-zone">
                        <p>
                          {isDropActive
                            ? "Release to drop here"
                            : hasActiveFilters
                            ? "No matching tasks"
                            : "No tasks yet"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Inline Add Button in Column */}
                  {addingToCol === col.key ? (
                    <div className="inline-add-card">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Task title... (Press Enter)"
                        value={colTaskTitle}
                        onChange={(e) => setColTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleInlineAdd(col.key);
                          if (e.key === "Escape") setAddingToCol(null);
                        }}
                      />
                      <div className="inline-actions">
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleInlineAdd(col.key)}
                        >
                          Add
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => setAddingToCol(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="column-add-btn"
                      onClick={() => {
                        setAddingToCol(col.key);
                        setColTaskTitle("");
                      }}
                    >
                      + Add Task
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View (Responsive: Table on Desktop, Stacked Cards on Mobile) */
        <div className="task-list-view-card">
          <div className="list-view-header">
            <span className="col-hdr-task">Task</span>
            <span className="col-hdr-status">Status</span>
            <span className="col-hdr-priority">Priority</span>
            <span className="col-hdr-due">Due Date</span>
            <span className="col-hdr-assignee">Assignee</span>
          </div>

          <div className="list-view-rows">
            {filteredTasks.length === 0 ? (
              <div className="list-empty-state">
                <p>No tasks match the active filters.</p>
                {hasActiveFilters && (
                  <button className="btn-secondary btn-sm" onClick={clearAllFilters} style={{ marginTop: 10 }}>
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredTasks.map((t) => {
                const assignee = users.find((u) => u.id === t.assignee_id);
                const isOverdue = t.due_date && t.due_date < today && t.status !== "done";

                return (
                  <div
                    key={t.id}
                    className="list-row"
                    onClick={() => setSelectedTask(t)}
                  >
                    <div className="list-col-task">
                      <span className="list-task-id">#{t.id}</span>
                      <span className="list-task-title">{t.title}</span>
                    </div>

                    <div className="list-col-badges">
                      <div className="list-col-status">
                        <span className={`status-pill pill-${t.status}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="list-col-priority">
                        <span className={`priority-pill priority-${t.priority}`}>
                          {t.priority}
                        </span>
                      </div>

                      <div className="list-col-due">
                        {t.due_date ? (
                          <span className={isOverdue ? "text-danger" : "text-muted"}>
                            {isOverdue ? `⚠️ ${t.due_date}` : t.due_date}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </div>

                      <div className="list-col-assignee">
                        {assignee ? (
                          <span className="assignee-text">👤 {assignee.name}</span>
                        ) : (
                          <span className="text-faint">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          isOwner={isOwner}
          onClose={() => setSelectedTask(null)}
          onUpdated={loadTasks}
        />
      )}
    </div>
  );
}
