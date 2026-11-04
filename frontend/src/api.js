// const BASE = "http://localhost:8000"
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";


export async function getTasks(projectId){
  const res = await request(`/tasks?project_id=${projectId}`)
  if (!res.ok) throw new Error("Failed to load tasks")
    return res.json();
}

export async function createTask(projectId, data) {
  const res = await request(`/projects/${projectId}/tasks`, {
      method: "POST", 
      body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}


export async function updateTask(taskId, data) {
    const res = await request(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (res.status === 403) throw new Error("You do not have permission to do this");
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}


export async function deleteTask(taskId) {
    const res = await request(`/tasks/${taskId}`, { method: "DELETE" });
    if (res.status === 403) throw new Error("Only the project owner can delete tasks")
    if (!res.ok) throw new Error("Failed to delete task");
}

export async function getProjects() {
    const res = await request(`/projects`);
    if (!res.ok) throw new Error("Failed to load projects");
    return res.json();
}

export async function getUsers() {
  const res = await request(`/users`);
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export async function createProject(data) {
  const res = await request(`/projects`, {
    method: "POST", 
    body: JSON.stringify(data),
  })
  if (!res.ok){
    const err = await res.json();
    throw new Error("Failed to create project");
  }

  return res.json();
}

export async function getComments(taskId) {
  const res = await request(`/tasks/${taskId}/comments`);
  if (!res.ok) throw new Error("Failed to load comments");
  return res.json();
}

export async function createComment(taskId, data) {
  const res = await request(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export function getToken(){
  return localStorage.getItem("token")
}

export function clearToken(){
  localStorage.removeItem("token");
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error("Session expired");
  }
  return res;
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status == 429){
    const err = await res.json();
    throw new Error(err.detail)
  }

  if (!res.ok) throw new Error("Wrong email or password");
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
}

export async function signup(name, email, password) {
  const res = await request("/users", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error("Signup failed");
  return res.json();
}

export async function getMe() {
  const res = await request("/auth/me");
  if (!res.ok) throw new Error("Not logged in");
  return res.json();
}
