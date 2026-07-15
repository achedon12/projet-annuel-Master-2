export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost') + '/api';

// Pour le code qui tourne côté serveur (authorize() de NextAuth, route handlers).
// En Docker, NEXT_PUBLIC_API_URL vaut localhost:8000 : valable depuis le
// navigateur, mais depuis le conteneur frontend localhost désigne ce conteneur
// lui-même, pas le backend. INTERNAL_API_URL pointe sur le nom de service Docker.
// Hors Docker la variable est absente et on retombe sur l'URL publique.
export const SERVER_API_URL =
    (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost') + '/api';

export const Urls = {
  auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      logout: '/auth/logout',
      google: '/auth/google',
      magicLink: '/auth/magic-link',
      magicLogin: '/auth/magic-login',
      invitationLookup: (token) => `/auth/invitation?token=${encodeURIComponent(token)}`,
      acceptInvitation: '/auth/accept-invitation',
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
      seoAnalyze: '/articles/seo-analyze',
      exportNotion: (id) => `/articles/${id}/export/notion`,
      schedule: (id) => `/articles/${id}/schedule`,
      reminder: (id) => `/articles/${id}/reminder`,
  },
  organization: {
      get: '/organization',
      create: '/organization',
      members: '/organization/members',
      member: (userId) => `/organization/members/${userId}`,
      invitations: '/organization/invitations',
      invitation: (id) => `/organization/invitations/${id}`,
  },
  integrations: {
      notion: '/integrations/notion',
      google: '/integrations/google',
      googleCalendarConnect: '/integrations/google/calendar/connect',
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