import { API_CONFIG } from './config';
import { httpApi } from './httpApi';
import { mockApi } from './mockApi';

// Single switch point. UI components import `api` only and never know
// whether data comes from the mock layer or the Spring Boot REST API.
export const api = API_CONFIG?.useMock ? mockApi : httpApi;
export { mockControls } from './mockApi';
