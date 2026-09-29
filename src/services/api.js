const API_BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function saveApiKeys(keys) {
  const res = await fetch(`${API_BASE}/config/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(keys)
  });
  if (!res.ok) throw new Error('Failed to update keys');
  return res.json();
}

export async function generateModel(prompt, infillPercent = 20, apiKey = null, provider = 'gemini') {
  const res = await fetch(`${API_BASE}/chat/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompt, 
      infill_percent: infillPercent,
      api_key: apiKey,
      provider: provider
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Generation failed' }));
    throw new Error(err.detail || 'Failed to generate 3D model');
  }
  return res.json();
}

export async function refineModel(modelId, prompt, currentScad, infillPercent = 20, apiKey = null, provider = 'gemini') {
  const res = await fetch(`${API_BASE}/chat/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: modelId,
      prompt,
      current_scad: currentScad,
      infill_percent: infillPercent,
      api_key: apiKey,
      provider: provider
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Refinement failed' }));
    throw new Error(err.detail || 'Failed to refine model');
  }
  return res.json();
}

export async function recompileModel(modelId, scadCode, parameterOverrides, infillPercent = 20) {
  const res = await fetch(`${API_BASE}/cad/recompile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: modelId,
      scad_code: scadCode,
      parameter_overrides: parameterOverrides,
      infill_percent: infillPercent
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Recompilation failed' }));
    throw new Error(err.detail || 'Failed to recompile model');
  }
  return res.json();
}

export function getDownloadUrl(modelId) {
  return `${API_BASE}/cad/download/${modelId}.stl`;
}
