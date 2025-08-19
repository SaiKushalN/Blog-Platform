export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  wsUrl: 'https://your-domain.com',
  appName: 'Blog Platform',
  version: '1.0.0',
  debug: false,
  features: {
    realTimeComments: true,
    userNotifications: true,
    fileUploads: true,
    search: true,
    analytics: true
  },
  limits: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxImageSize: 2 * 1024 * 1024, // 2MB
    maxPostLength: 50000,
    maxCommentLength: 1000,
    maxTagsPerPost: 10
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 50
  },
  auth: {
    tokenExpiryWarning: 5 * 60 * 1000, // 5 minutes
    refreshTokenThreshold: 10 * 60 * 1000 // 10 minutes
  }
};
