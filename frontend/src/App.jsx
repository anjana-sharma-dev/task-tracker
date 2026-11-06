import { useEffect, useState } from "react";
import { getMe, getToken, clearToken, logout } from "./api";
import AuthForm from "./AuthForm";
import TaskApp from "./TaskApp";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  async function loadUser() {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    try {
      setUser(await getMe());
    } catch {
      clearToken();
    }
    setChecking(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (checking) return <p>Loading...</p>;
  if (!user) return <AuthForm onLoggedIn={loadUser} />;
  return <TaskApp user={user} onLogout={handleLogout} />;
}
