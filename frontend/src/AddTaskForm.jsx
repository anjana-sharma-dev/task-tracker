import { useState } from "react";
import { createTask } from "./api";

export default function AddTaskForm({projectId, onAdded}){
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask(projectId, {title, priority});
      setTitle("");
      onAdded();
    } catch (err) {
      alert(err.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="add-task-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          />

        
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>

      <button type="submit">+ Add Task</button>
    </form>
  );
}