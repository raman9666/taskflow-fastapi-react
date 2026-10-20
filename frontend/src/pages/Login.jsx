import { useState } from "react";
import { api, setToken } from "../api.js";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await api.register(form);
      const { access_token } = await api.login(form.email, form.password);
      setToken(access_token);
      onLogin(await api.me());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>TaskFlow</h1>
        <p className="muted">{mode === "login" ? "Sign in to your workspace" : "Create your account"}</p>
        {mode === "register" && (
          <input name="full_name" placeholder="Full name" value={form.full_name} onChange={update} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
        <input name="password" type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={update} minLength={8} required />
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
