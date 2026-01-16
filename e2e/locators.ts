/**
 * E2E Test Locator Aliases
 * Centralized data-testid selectors for Playwright tests
 */

export const locators = {
  // Navigation
  sidebar: '[data-testid="sidebar"]',
  navDashboard: '[data-testid="nav-dashboard"]',
  navAnalytics: '[data-testid="nav-analytics"]',
  navReports: '[data-testid="nav-reports"]',
  navSettings: '[data-testid="nav-settings"]',
  
  // Header
  globalSearch: '[data-testid="global-search"]',
  themeToggle: '[data-testid="theme-toggle"]',
  notificationBell: '[data-testid="notification-bell"]',
  notificationBadge: '[data-testid="notification-badge"]',
  userMenu: '[data-testid="user-menu"]',
  
  // Dashboard
  keywordInput: '[data-testid="keyword-input"]',
  keywordSubmit: '[data-testid="keyword-submit"]',
  keywordList: '[data-testid="keyword-list"]',
  keywordItem: '[data-testid="keyword-item"]',
  mentionCard: '[data-testid="mention-card"]',
  mentionFeed: '[data-testid="mention-feed"]',
  loadMoreButton: '[data-testid="load-more"]',
  sentimentFilter: '[data-testid="sentiment-filter"]',
  
  // Analytics
  dateRangeSelect: '[data-testid="date-range-select"]',
  refreshButton: '[data-testid="refresh-button"]',
  sentimentChart: '[data-testid="sentiment-chart"]',
  mentionsChart: '[data-testid="mentions-chart"]',
  topicsChart: '[data-testid="topics-chart"]',
  filterSidebar: '[data-testid="filter-sidebar"]',
  
  // Reports
  reportForm: '[data-testid="report-form"]',
  reportNameInput: '[data-testid="report-name-input"]',
  generateReportButton: '[data-testid="generate-report"]',
  exportPdfButton: '[data-testid="export-pdf"]',
  exportCsvButton: '[data-testid="export-csv"]',
  reportPreview: '[data-testid="report-preview"]',
  
  // Settings
  settingsTabs: '[data-testid="settings-tabs"]',
  profileTab: '[data-testid="profile-tab"]',
  notificationsTab: '[data-testid="notifications-tab"]',
  appearanceTab: '[data-testid="appearance-tab"]',
  
  // Stats
  statCard: '[data-testid="stat-card"]',
  statValue: '[data-testid="stat-value"]',
  
  // Common
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  emptyState: '[data-testid="empty-state"]',
  skeleton: '[data-testid="skeleton"]',
};

/**
 * Helper function to get locator by name
 */
export function getLocator(name: keyof typeof locators): string {
  return locators[name];
}
