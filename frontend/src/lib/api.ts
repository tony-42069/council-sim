const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export interface CreateSimulationResponse {
  simulation_id: string;
  status: string;
  ws_url: string;
}

export async function createSimulation(data: {
  city_name: string;
  state: string;
  company_name: string;
  proposal_details: string;
  concerns: string[];
  document?: File;
}): Promise<CreateSimulationResponse> {
  const formData = new FormData();
  formData.append('city_name', data.city_name);
  formData.append('state', data.state);
  formData.append('company_name', data.company_name);
  formData.append('proposal_details', data.proposal_details);
  formData.append('concerns', data.concerns.join(','));

  if (data.document) {
    formData.append('document', data.document);
  }

  const response = await fetch(`${API_BASE}/api/simulations`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to create simulation: ${response.statusText}`);
  }

  return response.json();
}

export function getWebSocketUrl(simulationId: string): string {
  const wsBase = (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000').replace(/\/+$/, '');
  return `${wsBase}/ws/simulation/${simulationId}`;
}
