import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar: string;
  address?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly loginUrl = 'http://localhost:3002/api/login';
  private readonly registerUrl = 'http://localhost:3002/api/register';
  private readonly socialUrl = 'http://localhost:3002/api/auth/social';

  // Store the logged-in user state
  readonly currentUser = signal<User | null>(null);

  // Computed state for authentication
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    // Check if user session exists in localStorage
    const cachedUser = localStorage.getItem('lightbooks_user');
    if (cachedUser) {
      try {
        const raw = JSON.parse(cachedUser);
        // Tương thích ngược: nếu user cũ lưu _id thay vì id, hoặc lưu cả object response
        const actualUser = raw.user || raw; // trường hợp cũ lưu cả { token, user: {...} }
        const userObj: User = {
          ...actualUser,
          id: actualUser.id || actualUser._id?.toString(),
        };
        this.currentUser.set(userObj);
      } catch {
        this.clearSession();
      }
    }

    // Refresh user session from API in the background if token exists
    const token = this.getAccessToken();
    if (token) {
      this.loadUserProfile().subscribe({
        error: () => {
          console.log('Không thể phân giải thông tin từ AccessToken (hết hạn hoặc không hợp lệ).');
          this.clearSession();
        }
      });
    } else if (cachedUser) {
      console.warn('Stale session without token detected. Clearing session.');
      this.clearSession();
    }
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (token) return token;

    // Fallback to lightbooks_user cache
    const cachedUser = localStorage.getItem('lightbooks_user');
    if (cachedUser) {
      try {
        const raw = JSON.parse(cachedUser);
        const fbToken = raw.token || raw.accessToken || (raw.user && (raw.user.token || raw.user.accessToken));
        if (fbToken) {
          localStorage.setItem('accessToken', fbToken);
          return fbToken;
        }
      } catch (_) {}
    }
    return null;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private saveTokens(user: any): void {
    if (user.accessToken) {
      localStorage.setItem('accessToken', user.accessToken);
    }
    if (user.refreshToken) {
      localStorage.setItem('refreshToken', user.refreshToken);
    }
  }

  private clearSession(): void {
    this.currentUser.set(null);
    localStorage.removeItem('lightbooks_user');
    localStorage.removeItem('lightbook_user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Dispatch event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('user:updated'));
    }
    void this.router.navigate(['/login']);
  }

  // Load current user profile from GET /api/me using accessToken
  loadUserProfile(): Observable<User> {
    const token = this.getAccessToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any>('http://localhost:3002/api/me', { headers, withCredentials: true }).pipe(
      tap({
        next: (rawUser: any) => {
          // /api/me trả về { id, username, ... } (đã có id từ server)
          // Nhưng để chắc chắn, fallback _id → id
          const userObj: User = {
            ...rawUser,
            id: rawUser.id || rawUser._id?.toString(),
          };
          this.currentUser.set(userObj);
          localStorage.setItem('lightbooks_user', JSON.stringify(userObj));
        },
        error: () => {
          this.clearSession();
        }
      })
    );
  }

  // Real backend login
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.loginUrl, { email, password }).pipe(
      tap((res: any) => {
        // Server trả về { message, token, user: { _id, username, ... } }
        const rawUser = res.user || res;
        const userObj: User = {
          ...rawUser,
          id: rawUser.id || rawUser._id?.toString(),
        };
        this.currentUser.set(userObj);
        // Lưu token: server có thể trả trong res.token hoặc res.accessToken
        const tokenRes = { accessToken: res.token || res.accessToken, refreshToken: res.refreshToken };
        this.saveTokens(tokenRes);
        localStorage.setItem('lightbooks_user', JSON.stringify(userObj));
        localStorage.setItem('lightbook_user', JSON.stringify(userObj));
        
        // Dispatch event so that page-header and other components update immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user:updated'));
        }
      })
    );
  }

  // Real backend register
  register(phone: string, password: string, otpCode: string): Observable<any> {
    return this.http.post<any>(this.registerUrl, { phone, password, otpCode }).pipe(
      tap((res: any) => {
        const rawUser = res.user || res;
        const userObj: User = {
          ...rawUser,
          id: rawUser.id || rawUser._id?.toString(),
        };
        this.currentUser.set(userObj);
        const tokenRes = { accessToken: res.token || res.accessToken, refreshToken: res.refreshToken };
        this.saveTokens(tokenRes);
        localStorage.setItem('lightbooks_user', JSON.stringify(userObj));
        localStorage.setItem('lightbook_user', JSON.stringify(userObj));
        
        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user:updated'));
        }
      })
    );
  }

  // Real backend social login/register
  loginSocial(provider: string, email: string, name: string, avatar: string): Observable<any> {
    return this.http.post<any>(this.socialUrl, { provider, email, name, avatar }).pipe(
      tap((res: any) => {
        const rawUser = res.user || res;
        const userObj: User = {
          ...rawUser,
          id: rawUser.id || rawUser._id?.toString(),
        };
        this.currentUser.set(userObj);
        const tokenRes = { accessToken: res.token || res.accessToken, refreshToken: res.refreshToken };
        this.saveTokens(tokenRes);
        localStorage.setItem('lightbooks_user', JSON.stringify(userObj));
        localStorage.setItem('lightbook_user', JSON.stringify(userObj));
        
        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user:updated'));
        }
      })
    );
  }

  // Logout and clear state
  logout(): void {
    this.http.post('http://localhost:3002/api/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.clearSession();
      },
      error: () => {
        // Fallback clear if server is unreachable
        this.clearSession();
      }
    });
  }
}
