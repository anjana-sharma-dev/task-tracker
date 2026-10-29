import { useCallback, useEffect, useState } from "react"
import { getTasks, updateTask, deleteTask , getUsers} from "./api"
import AddTaskForm from "./AddTaskForm";
import Comments from "./Comments";
import "./Board.css";


const COLUMNS = [
  {"key": "todo", "title": "Todo"},
  {"key": "in_progress", "title": "In Progress"},
  {"key": "done", "title": "Done"},
]

export default function Board({projectId, isOwner}) {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState("");
    const [users, setUsers] = useState([])

    const loadTasks = useCallback(() => {
        getTasks(projectId)
          .then(setTasks)
          .catch((e) => setError(e.message));
      }, [projectId]);

    useEffect(()=> {
      loadTasks();
    }, [loadTasks])

    useEffect(()=> {
      getUsers().then(setUsers).catch((e)=> console.error(e))
    }, [])

    if (error) return <p>{error}</p>;
    
    const today = new Date().toLocaleDateString("en-CA");

    async function handleUpdate(taskID, changes) {
      try{
        await updateTask(taskID, changes);
        loadTasks();
      } catch (err) {
        alert(err.message);
      }
    }
  
    
    async function handleDelete(taskID) {
      if (!window.confirm("Do you want to delete this task?")) return;
      try{
        await deleteTask(taskID)
        loadTasks();
      } catch (err) {
          alert(err.message);
      }      
    }


  return (
    <div className="board-page">
      <div className="board-header">
        <div>
          <h1>Task Board</h1>
          <p>Organize your work and track progress.</p>
        </div>
        <span className="task-count">{tasks.length} Tasks</span>
      </div>

      <AddTaskForm projectId={projectId} onAdded={loadTasks} />
            
      <div className="board">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter(
            (t) => t.status === col.key
          );

          return (
            <div className={`column ${col.key}`} key={col.key}>
              <div className="column-header">
                <h3>{col.title}</h3>
                <span className="count">{columnTasks.length}</span>
              </div>

              <div className="task-list">
                {columnTasks.map((t) => (
                  <div className="task-card" key={t.id}>
                    <div className="task-card-top">
                      <span className={`priority ${t.priority}`}>
                        {t.priority}
                      </span>
                      <span className="task-id">#{t.id}</span>
                    </div>

                    <h4>{t.title}</h4>
                    {t.due_date && t.due_date < today && t.status !== "done" && (
                      <span style={{ color: "#dc2626", fontSize: 12, fontWeight: 600 }}>
                        Overdue
                      </span>
                    )}

                    <div className="task-field">
                      <label>Priority</label>
                      <select
                        value={t.priority}
                        onChange={(e) =>
                          handleUpdate(t.id, {
                            priority: e.target.value,
                          })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      Due:{" "}
                      <input
                        type="date"
                        value={t.due_date ?? ""}
                        onChange={(e) => handleUpdate(t.id, { due_date: e.target.value || null })}
                      />
                    </div>
                    {isOwner ? (
                      <div>
                        Assign to:{" "}
                        <select
                          value={t.assignee_id ?? ""}
                          onChange={(e) =>
                            handleUpdate(t.id, {assignee_id: e.target.value ? Number(e.target.value) : null,})
                          }
                        >
                          <option value="">Unassigned</option> {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        Assigned to: {users.find((u) => u.id === t.assignee_id)?.name ?? "Unassigned"}
                      </div>
                    )}

                    <div className="task-field">
                      <label>Move to</label>
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleUpdate(t.id, {
                            status: e.target.value,
                          })
                        }
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      {isOwner && (
                        <button onClick={() => handleDelete(t.id)} style={{ marginLeft: 8 }}>Delete</button>
                      )}
                      <Comments taskId={t.id} />
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="empty-state">
                    No tasks yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );  
};
