// HTTP is the default; set NEXT_PUBLIC_USE_MOCK_API=true for the optional demo adapter.
// Override NEXT_PUBLIC_API_BASE_URL for another origin, or use '' for same-origin hosting.
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  investorId: 1,
  useMock: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true',
};

export const endpoints = {
  portfolio: () => `${API_CONFIG?.baseUrl}/api/investors/${API_CONFIG?.investorId}/portfolio`,
  withdrawalNotices: () =>
    `${API_CONFIG?.baseUrl}/api/investors/${API_CONFIG?.investorId}/withdrawal-notices`,
  exportNotices: () =>
    `${API_CONFIG?.baseUrl}/api/investors/${API_CONFIG?.investorId}/withdrawal-notices/export`,
};
