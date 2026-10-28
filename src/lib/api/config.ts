// Base URL is configurable so the mock layer can be swapped for Spring Boot.
// Set NEXT_PUBLIC_API_BASE_URL (e.g. https://api.enviro365.example) and
// NEXT_PUBLIC_USE_MOCK_API=false to call real endpoints under /api/investors/1/.
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  investorId: 1,
  useMock: process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false',
};

export const endpoints = {
  portfolio: () => `${API_CONFIG?.baseUrl}/api/investors/${API_CONFIG?.investorId}/portfolio`,
  withdrawalNotices: () =>
    `${API_CONFIG?.baseUrl}/api/investors/${API_CONFIG?.investorId}/withdrawal-notices`,
  exportNotices: () =>
    `${API_CONFIG?.baseUrl}/api/investors/${API_CONFIG?.investorId}/withdrawal-notices/export`,
};
