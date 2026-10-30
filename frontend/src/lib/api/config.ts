// HTTP is the default; set NEXT_PUBLIC_USE_MOCK_API=true for the optional demo adapter.
// Production defaults to same-origin /api; local Next.js development uses Spring Boot's port.
// NEXT_PUBLIC_* values are compiled into the frontend at build time.
export const API_CONFIG = {
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : ''),
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
