import { useState, useEffect } from "react";
import { createProject } from "./api";

export default function AddProjectForm({ onAdded }) {
  const [name, setName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {

      const project = await createProject({ name });
      setName("");
      onAdded(project);
    } catch (err){
      alert(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "inline-flex", gap: 8, marginLeft: 16 }}>
      <input value={name} onChange={(e) => setName(e.target.value)}/>
      <button type="submit">Add Project</button>
    </form>
  );

}

