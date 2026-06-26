import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  username: string;
  email?: string;
  phone?: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);

  // Store the logged-in user state
  readonly currentUser = signal<User | null>(null);

  // Computed state for authentication
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    // Check if user session exists in localStorage
    const cachedUser = localStorage.getItem('lightbook_user');
    if (cachedUser) {
      try {
        this.currentUser.set(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem('lightbook_user');
      }
    }
  }

  // Simulate login with Email
  loginWithEmail(email: string): boolean {
    const mockUser: User = {
      username: email.split('@')[0],
      email: email,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
    this.currentUser.set(mockUser);
    localStorage.setItem('lightbook_user', JSON.stringify(mockUser));
    return true;
  }

  // Simulate login with Phone & OTP
  loginWithOtp(phone: string): boolean {
    const mockUser: User = {
      username: `User_${phone.substring(phone.length - 4)}`,
      phone: phone,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_otp'
    };
    this.currentUser.set(mockUser);
    localStorage.setItem('lightbook_user', JSON.stringify(mockUser));
    return true;
  }

  // Logout and clear state
  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('lightbook_user');
    void this.router.navigate(['/login']);
  }
}
