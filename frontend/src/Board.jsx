import { useCallback, useEffect, useState } from "react"
import { getTasks, updateTask, deleteTask } from "./api"
import AddTaskForm from "./AddTaskForm";
import Comments from "./Comments";
import "./Board.css";


const COLUMNS = [
  {"key": "todo", "title": "Todo"},
  {"key": "in_progress", "title": "In Progress"},
  {"key": "done", "title": "Done"},
]

export default function Board({projectId, canDelete}) {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState("");


    const loadTasks = useCallback(() => {
        getTasks(projectId)
          .then(setTasks)
          .catch((e) => setError(e.message));
      }, [projectId]);
      
    useEffect(()=> {
      loadTasks();
    }, [loadTasks])


    if (error) return <p>{error}</p>;

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
                      {canDelete && (
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

