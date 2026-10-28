// Use Vite's /api proxy during local development. In production, set VITE_API_BASE_URL.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(`Could not reach the API (${error?.message || 'network error'}). Check that FastAPI is running on port 8000.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || data) || '';
    throw new Error(detail || `API request failed with HTTP ${response.status}`);
  }
  return data;
}

export const analyzeEmail = (email) => request('/api/analyze', email);
export const draftReply = (email) => request('/api/draft', email);
export const sendReply = (reply) => request('/api/send', reply);
