const API_BASE = '/api';

async function fetchApi(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Items
  getItems: (params?: { codigo?: string; titulo?: string; tipo_dado?: string }) => {
    const query = new URLSearchParams();
    if (params?.codigo) query.append('codigo', params.codigo);
    if (params?.titulo) query.append('titulo', params.titulo);
    if (params?.tipo_dado) query.append('tipo_dado', params.tipo_dado);
    return fetchApi(`/items?${query}`);
  },
  getItem: (codigo: string) => fetchApi(`/items/${codigo}`),
  createItem: (data: any) => fetchApi('/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (codigo: string, data: any) => fetchApi(`/items/${codigo}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (codigo: string) => fetchApi(`/items/${codigo}`, { method: 'DELETE' }),
  checkItem: (codigo: string) => fetchApi(`/items/${codigo}/check`),
  importItems: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/items/import`, { method: 'POST', body: formData }).then(r => {
      if (!r.ok) throw new Error('Import failed');
      return r.json();
    });
  },

  // Formularios
  getFormularios: () => fetchApi('/formularios'),
  getFormulario: (id: string) => fetchApi(`/formularios/${id}`),
  createFormulario: (data: any) => fetchApi('/formularios', { method: 'POST', body: JSON.stringify(data) }),
  updateFormulario: (id: string, data: any) => fetchApi(`/formularios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFormulario: (id: string) => fetchApi(`/formularios/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => fetchApi('/dashboard/stats'),
  getNaoConformidades: () => fetchApi('/dashboard/nao-conformidades'),
  getDistribuicaoStatus: () => fetchApi('/dashboard/distribuicao-status'),
  getUltimasInspecoes: () => fetchApi('/dashboard/ultimas-inspecoes'),

  // Inspecoes
  batchInspecoes: (data: any) => fetchApi('/inspecoes/batch', { method: 'POST', body: JSON.stringify(data) }),
};
