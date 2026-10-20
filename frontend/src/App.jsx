import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center">Loading…</div>;
  if (!user) return <Login onLogin={setUser} />;
  return (
    <Dashboard
      user={user}
      onLogout={() => {
        clearToken();
        setUser(null);
      }}
    />
  );
}
