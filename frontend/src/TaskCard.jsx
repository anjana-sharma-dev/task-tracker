import React from "react";

export default function TaskCard({ task, users, isOwner, onClick, onStatusChange }) {
  const today = new Date().toLocaleDateString("en-CA");
  const isOverdue = task.due_date && task.due_date < today && task.status !== "done";
  
  const assignee = users.find((u) => u.id === task.assignee_id);
  const assigneeInitials = assignee?.name
    ? assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : null;

  function handleDragStart(e) {
    e.dataTransfer.setData("application/task-id", String(task.id));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      className={`task-card ${isOverdue ? "is-overdue" : ""}`}
      draggable={true}
      onDragStart={handleDragStart}
      onClick={() => onClick(task)}
    >
      <div className="task-card-header">
        <span className={`priority-pill priority-${task.priority}`}>
          {task.priority}
        </span>
        <span className="task-id">#{task.id}</span>
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.labels && task.labels.length > 0 && (
        <div className="task-card-labels">
          {task.labels.map((lbl) => (
            <span
              key={lbl.id}
              className="label-chip"
              style={{ backgroundColor: lbl.color + "22", color: lbl.color, borderColor: lbl.color + "55" }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-meta">
        {task.due_date && (
          <span
            className={`meta-chip ${isOverdue ? "meta-chip-overdue" : ""}`}
            title={isOverdue ? `Overdue: ${task.due_date}` : `Due: ${task.due_date}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{isOverdue ? `⚠️ ${task.due_date}` : task.due_date}</span>
          </span>
        )}

        <div className="meta-right">
          {assignee ? (
            <span className="assignee-pill" title={`Assigned to ${assignee.name}`}>
              <span className="avatar-circle-sm">{assigneeInitials}</span>
              <span className="assignee-name">{assignee.name}</span>
            </span>
          ) : (
            <span className="assignee-pill unassigned" title="Unassigned">
              <span className="avatar-circle-sm unassigned-avatar">?</span>
              <span className="assignee-name">Unassigned</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
