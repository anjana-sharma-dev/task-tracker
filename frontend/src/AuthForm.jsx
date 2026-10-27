import { useState, useEffect } from "react";
import { login, signup } from "./api";
import "./AuthForm.css";

export default function AuthForm({onLoggedIn}) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (mode === "signup"){
        await signup(name, email, password)
      }
      await login(email, password)
      onLoggedIn();
    } catch (err){
      alert(err.message);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 280 }}>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p className="auth-sub">
          {mode === "login" ? "Login to Team Task Tracker" : "Sign up to get started"}
        </p>
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"/>
        <button type="submit" className="auth-primary">{mode === "login" ? "Login" : "Create account"}</button>
        <button type="button" className="auth-link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "New here? Sign up" : "Have an account? Login"}
        </button>
      </form>
    </div>
  )  
}
