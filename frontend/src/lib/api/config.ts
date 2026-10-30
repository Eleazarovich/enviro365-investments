// NEXT_PUBLIC_* values are compiled into the frontend at build time.
// Production uses same-origin /api; local development uses Spring Boot's port.
const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');
const investorId = 1;

export const endpoints = {
  portfolio: () => `${baseUrl}/api/investors/${investorId}/portfolio`,
  withdrawalNotices: () => `${baseUrl}/api/investors/${investorId}/withdrawal-notices`,
  exportNotices: () => `${baseUrl}/api/investors/${investorId}/withdrawal-notices/export`,
};
