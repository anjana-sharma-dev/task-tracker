import { useCallback, useEffect , useState} from "react";
import Board from "./Board";
import { getProjects } from "./api";
import AddProjectForm from "./AddProjectForm";


export default function TaskApp({user, onLogout}){
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null)

  const loadProjects= useCallback(() => {
    return getProjects().then((data)=> {
      setProjects(data)
      setProjectId((current)=> current ?? data[0]?.id ?? null);
    })
    .catch((e)=> console.error(e))
  }, [])


  useEffect(()=> {
     loadProjects();
  }, [loadProjects]);

  async function handleProjectAdded(project) {
    await loadProjects();
    setProjectId(project.id);
  }

  const currentProject = projects.find((p)=> p.id === projectId);
  const isOwner = currentProject?.owner_id === user.id;

  return( 
    <div style={{ padding: 24 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Team Task Tracker</h1>
          <div>
            {user.name} <button onClick={onLogout}>Logout</button>
          </div>
        </div>
        <select value={projectId ?? ""} onChange={(e) => setProjectId(Number(e.target.value))} style={{ marginBottom: 16 }} >
          {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>))}
          
        </select>
        <AddProjectForm onAdded={handleProjectAdded} />
      </div>
        {projectId !== null && <Board projectId={projectId} isOwner = {isOwner} />}    
    </div>
  );
}
