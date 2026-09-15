const BASE = '/api';

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: opts.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...opts
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  users: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  sessions: () => request('/sessions'),
  session: (id) => request(`/sessions/${id}`),
  createSession: (payload) => request('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  addVersion: (sessionId, payload) =>
    request(`/sessions/${sessionId}/versions`, { method: 'POST', body: JSON.stringify(payload) }),
  closeVersion: (sessionId, versionId) =>
    request(`/sessions/${sessionId}/versions/${versionId}/close`, { method: 'PATCH' }),
  deleteVersion: (sessionId, versionId) =>
    request(`/sessions/${sessionId}/versions/${versionId}`, { method: 'DELETE' }),
  addGrade: (sessionId, versionId, payload) =>
    request(`/sessions/${sessionId}/versions/${versionId}/grades`, { method: 'POST', body: JSON.stringify(payload) }),

  setBuyer: (sessionId, buyerId) =>
    request(`/sessions/${sessionId}/buyer`, { method: 'PATCH', body: JSON.stringify({ buyerId }) }),
  toggleFR: (sessionId) => request(`/sessions/${sessionId}/fr`, { method: 'PATCH' }),
  setComite: (sessionId, comiteDate) =>
    request(`/sessions/${sessionId}/comite`, { method: 'PATCH', body: JSON.stringify({ comiteDate }) }),
  savePrice: (sessionId, payload) =>
    request(`/sessions/${sessionId}/price`, { method: 'PUT', body: JSON.stringify(payload) }),

  uploadPhoto: (sessionId, file, label) => {
    const form = new FormData();
    form.append('photo', file);
    form.append('label', label);
    return request(`/sessions/${sessionId}/photos`, { method: 'POST', body: form });
  }
};
