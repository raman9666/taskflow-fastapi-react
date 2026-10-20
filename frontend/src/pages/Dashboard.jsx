import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

const STATUSES = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];
const EMPTY = { title: "", description: "", priority: "medium", due_date: "" };

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: "", priority: "" });
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([api.listTasks(filters), api.stats()]);
      setTasks(list);
      setStats(s);
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTask(e) {
    e.preventDefault();
    await api.createTask({ ...draft, due_date: draft.due_date || null });
    setDraft(EMPTY);
    load();
  }

  async function move(task, status) {
    await api.updateTask(task.id, { status });
    load();
  }

  async function remove(task) {
    await api.deleteTask(task.id);
    load();
  }

  const isOverdue = (t) => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date(new Date().toDateString());

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">TaskFlow</div>
        <div className="user">
          <span>{user.full_name}</span>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      {stats && (
        <section className="stats">
          <Stat label="Total" value={stats.total} />
          <Stat label="To do" value={stats.todo} />
          <Stat label="In progress" value={stats.in_progress} />
          <Stat label="Done" value={stats.done} />
          <Stat label="Overdue" value={stats.overdue} tone="danger" />
        </section>
      )}

      <section className="toolbar">
        <form className="new-task" onSubmit={addTask}>
          <input placeholder="New task title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
          <button className="primary">Add task</button>
        </form>
        <div className="filters">
          <input placeholder="Search…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="board">
        {STATUSES.map((col) => (
          <div className="column" key={col.key}>
            <h2>{col.label} <span className="count">{tasks.filter((t) => t.status === col.key).length}</span></h2>
            {tasks.filter((t) => t.status === col.key).map((t) => (
              <article className="card" key={t.id}>
                <div className="card-head">
                  <span className={`badge ${t.priority}`}>{t.priority}</span>
                  {t.due_date && <span className={isOverdue(t) ? "due overdue" : "due"}>Due {t.due_date}</span>}
                </div>
                <h3>{t.title}</h3>
                {t.description && <p>{t.description}</p>}
                <div className="actions">
                  {STATUSES.filter((s) => s.key !== t.status).map((s) => (
                    <button key={s.key} className="ghost small" onClick={() => move(t, s.key)}>→ {s.label}</button>
                  ))}
                  <button className="ghost small danger" onClick={() => remove(t)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone || ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
