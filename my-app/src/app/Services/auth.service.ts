import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id?: string;
  username: string;
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
        this.currentUser.set(JSON.parse(cachedUser));
      } catch {
        this.clearSession();
      }
    }

    // Refresh user session from API in the background if token exists
    if (this.getAccessToken()) {
      this.loadUserProfile().subscribe({
        error: () => console.log('Không thể phân giải thông tin từ AccessToken (hết hạn hoặc không hợp lệ).')
      });
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
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
    return this.http.get<User>('http://localhost:3002/api/me', { headers, withCredentials: true }).pipe(
      tap({
        next: (user) => {
          this.currentUser.set(user);
          localStorage.setItem('lightbooks_user', JSON.stringify(user));
        },
        error: () => {
          this.clearSession();
        }
      })
    );
  }

  // Real backend login
  login(email: string, password: string): Observable<User> {
    return this.http.post<User>(this.loginUrl, { email, password }).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.saveTokens(user);
        localStorage.setItem('lightbooks_user', JSON.stringify(user));
        localStorage.setItem('lightbook_user', JSON.stringify(user));
        
        // Dispatch event so that page-header and other components update immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user:updated'));
        }
      })
    );
  }

  // Real backend register
  register(phone: string, password: string, otpCode: string): Observable<User> {
    return this.http.post<User>(this.registerUrl, { phone, password, otpCode }).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.saveTokens(user);
        localStorage.setItem('lightbooks_user', JSON.stringify(user));
        localStorage.setItem('lightbook_user', JSON.stringify(user));
        
        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user:updated'));
        }
      })
    );
  }

  // Real backend social login/register
  loginSocial(provider: string, email: string, name: string, avatar: string): Observable<User> {
    return this.http.post<User>(this.socialUrl, { provider, email, name, avatar }).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.saveTokens(user);
        localStorage.setItem('lightbooks_user', JSON.stringify(user));
        localStorage.setItem('lightbook_user', JSON.stringify(user));
        
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
