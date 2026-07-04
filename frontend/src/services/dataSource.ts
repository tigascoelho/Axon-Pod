import { podApi, mockPodApi } from './podApi';
import { backendApi, mockBackendApi } from './backendApi';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

console.log(`[DataSource] Pod: ${USE_MOCKS ? 'MOCK' : 'REAL'} services`);
console.log(`[DataSource] Backend: MOCK services (Cloud not implemented yet)`);

export const api = {
  pod: USE_MOCKS ? mockPodApi : podApi,
  backend: mockBackendApi // Force mock backend so UI doesn't crash on dummy supabase url
};
