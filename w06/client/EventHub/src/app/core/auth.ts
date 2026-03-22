import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginResponse {
  token: string;
  expires_in: string;
  user: any;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly TOKEN_KEY = 'eventhub_token';
  private readonly USER_KEY = 'eventhub_user';
  private readonly EXPIRES_KEY = 'eventhub_token_expires';
  private userSubject = new BehaviorSubject<any>(this.loadUser());
  private readonly baseUrl: string = (window as any).__env?.API_URL || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // keep auth state in sync across browser tabs/windows
  private storageListener = (ev: StorageEvent) => {
    if (ev.key === this.TOKEN_KEY) {
      // token changed or removed
      if (!ev.newValue) {
        // logged out in another tab
        this.userSubject.next(null);
      } else {
        // token added/updated: try to load user from storage
        this.userSubject.next(this.loadUser());
      }
    }
    if (ev.key === this.USER_KEY && ev.newValue) {
      try {
        this.userSubject.next(JSON.parse(ev.newValue));
      } catch {
        this.userSubject.next(null);
      }
    }
  };

  ngOnInit?: never; // marker

  // attach listener when service constructed
  private attachStorageListener() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', this.storageListener);
    }
  }

  // detach if needed (not strictly necessary for root service)
  private detachStorageListener() {
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('storage', this.storageListener);
    }
  }

  // call attach immediately
  private _init_called = (() => {
    try {
      // attach listener synchronously
      if (typeof window !== 'undefined') this.attachStorageListener();
    } catch {}
    return true;
  })();

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    const url = `${this.baseUrl}/api/auth/login`;
    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap((resp) => {
        if (resp && resp.token) {
          localStorage.setItem(this.TOKEN_KEY, resp.token);
          // store expiry as epoch ms
          const expiresSec = parseInt(String(resp.expires_in || '0'), 10) || 0;
          const expiresAt = Date.now() + expiresSec * 1000;
          localStorage.setItem(this.EXPIRES_KEY, String(expiresAt));
          localStorage.setItem(this.USER_KEY, JSON.stringify(resp.user || null));
          this.userSubject.next(resp.user || null);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this.userSubject.next(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expRaw = localStorage.getItem(this.EXPIRES_KEY);
    if (!token) return null;
    if (expRaw) {
      const exp = parseInt(expRaw, 10) || 0;
      if (Date.now() >= exp) {
        // token expired -> clear and notify
        this.logout();
        return null;
      }
    }
    return token;
  }

  getUser(): any {
    return this.userSubject.value;
  }

  user$(): Observable<any> {
    return this.userSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadUser(): any {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
