const TOKEN_KEY = "taskflow_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = new URLSearchParams(form);
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(path, { method, headers, body: payload });
  if (res.status === 401) clearToken();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  register: (data) => request("/api/auth/register", { method: "POST", body: data }),
  login: (email, password) => request("/api/auth/login", { method: "POST", form: { username: email, password } }),
  me: () => request("/api/auth/me"),
  listTasks: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/api/tasks${qs ? `?${qs}` : ""}`);
  },
  stats: () => request("/api/tasks/stats"),
  createTask: (data) => request("/api/tasks", { method: "POST", body: data }),
  updateTask: (id, data) => request(`/api/tasks/${id}`, { method: "PATCH", body: data }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
};
