export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost') + '/api';

export const Urls = {
  auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      logout: '/auth/logout',
  },
  user: {
      ips: '/user/ips',
      stats: '/user/stats',
  },
  ideas: {
      generate: '/ideas/generate',
  },
  articles: {
      list: '/articles',
      one: (id) => `/articles/${id}`,
      publish: (id) => `/articles/${id}/publish`,
      generateContent: '/articles/generate-content',
      rewrite: '/articles/rewrite',
      aiAction: '/articles/ai-action',
  },
  me: {
      get: '/me',
      update: '/me',
      password: '/me/password',
      notifications: '/me/notifications',
  },
  admin: {
      stats: '/admin/stats',
      users: '/admin/users',
      user: (id) => `/admin/users/${id}`,
      articles: '/admin/articles',
      article: (id) => `/admin/articles/${id}`,
      ideas: '/admin/ideas',
      mails: '/admin/mails',
      loginIps: '/admin/login-ips',
      bannedIps: '/admin/banned-ips',
      bannedIp: (id) => `/admin/banned-ips/${id}`,
  },
};