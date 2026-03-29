import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

const TOKEN_KEY = 'eventhub_token';
const EXPIRES_KEY = 'eventhub_token_expires';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        notification.showError('Network error');
        return throwError(() => err);
      }

      const httpErr = err as HttpErrorResponse;
      const body = httpErr.error || {};
      const code = (body && body.code) || '';
      const message = (body && body.message) || httpErr.message || 'An error occurred';
      const traceId = body && body.traceId;

      // Strategy by machine-readable code
      switch (code) {
        case 'AUTHENTICATION_ERROR':
        case 'AUTHENTICATION_REQUIRED':
        case 'AUTHENTICATION_FAILED':
          // clear session; only redirect if user is not already on the login page
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(EXPIRES_KEY);
          notification.showInfo('Please sign in to continue');
          try {
            const current = router.url || '';
            const onLogin = current.startsWith('/auth/login') || current === '/login';
            if (!onLogin) router.navigate(['/auth/login']);
          } catch {}
          break;

        case 'AUTHORIZATION_ERROR':
        case 'AUTHORIZATION_FAILED':
          notification.showWarn("You don't have permission to perform this action");
          break;

        case 'VALIDATION_ERROR':
          // Let the calling component handle validation errors (inline)
          return throwError(() => httpErr);

        case 'RESOURCE_NOT_FOUND':
          notification.showWarn(message || 'Requested resource not found');
          // Optionally navigate to a 404 route if one exists
          try { router.navigate(['/not-found']); } catch {}
          break;

        case 'SEAT_ALREADY_RESERVED':
        case 'TICKET_TYPE_SOLD_OUT':
        case 'CONFLICT_ERROR':
          notification.showWarn(message || 'Resource conflict; please try a different option');
          break;

        case 'BUSINESS_RULE_VIOLATION':
          notification.showWarn(message);
          break;

        case 'INTERNAL_ERROR':
          notification.showError(`Something went wrong — reference: ${traceId || 'N/A'}`);
          break;

        default:
          // Fallback based on HTTP status
          if (httpErr.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EXPIRES_KEY);
            notification.showInfo('Please sign in to continue');
            try {
              const current = router.url || '';
              const onLogin = current.startsWith('/auth/login') || current === '/login';
              if (!onLogin) router.navigate(['/auth/login']);
            } catch {}
          } else if (httpErr.status === 403) {
            notification.showWarn("You don't have permission to perform this action");
          } else if (httpErr.status === 404) {
            notification.showWarn('Requested resource not found');
          } else {
            notification.showError(message);
          }
      }

      // Re-throw so callers can still observe error details when needed
      return throwError(() => httpErr);
    })
  );
};
