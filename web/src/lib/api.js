import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL });

const TOKEN_KEY = 'cadence.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Injection du jeton sur chaque requête.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sur 401 : purge la session et redirige vers /login (sauf si déjà sur /login).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      setToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

/** Extrait un message d'erreur lisible d'une erreur axios (format errorHandler back). */
export function apiError(error, fallback = 'Une erreur est survenue.') {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (Array.isArray(data?.details) && data.details.length) {
    return data.details.map((d) => d.message).join(' · ');
  }
  return error?.message || fallback;
}

/** Map { champ: message } à partir des `details` de validation renvoyés par l'API. */
export function apiFieldErrors(error) {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, d) => {
    if (d.field && !acc[d.field]) acc[d.field] = d.message;
    return acc;
  }, {});
}
