import axios from 'axios';

// Dev: Vite proxies /api → localhost:8000
// Prod (GitHub Pages): call backend directly
const API_BASE = import.meta.env.PROD
  ? 'http://localhost:8000/api'
  : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});
