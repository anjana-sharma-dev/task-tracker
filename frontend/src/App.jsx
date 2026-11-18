import { useEffect, useState } from "react";
import { getMe, getToken, clearToken, logout } from "./api";
import AuthForm from "./AuthForm";
import TaskApp from "./TaskApp";
import { ToastProvider } from "./Toast";

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

  if (checking) return <div className="app-loading-screen"><div className="spinner"></div></div>;

  return (
    <ToastProvider>
      {!user ? (
        <AuthForm onLoggedIn={loadUser} />
      ) : (
        <TaskApp user={user} onLogout={handleLogout} />
      )}
    </ToastProvider>
  );
}
