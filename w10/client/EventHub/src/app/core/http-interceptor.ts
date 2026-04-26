import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'eventhub_token';
const EXPIRES_KEY = 'eventhub_token_expires';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return next(req);
  }

  // Check if token has expired
  const expRaw = localStorage.getItem(EXPIRES_KEY);
  if (expRaw) {
    const exp = parseInt(expRaw, 10) || 0;
    if (Date.now() >= exp) {
      // Token expired — don't attach it, let the request go without auth
      return next(req);
    }
  }

  // Attach the valid token
  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(cloned);
};
