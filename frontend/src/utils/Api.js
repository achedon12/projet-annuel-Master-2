export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost') + '/api';

export const Urls = {
  auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      logout: '/auth/logout',
  },
  user: {
      ips: '/user/ips',
  }
};