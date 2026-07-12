import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Notification {
  _id?: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3002/api/notifications';

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);

  loadNotifications(role?: string) {
    const token = this.auth.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = this.apiUrl;
    if (role) {
      url += `?role=${role}`;
    }
    this.http.get<Notification[]>(url, { headers }).subscribe({
      next: (res) => {
        if (res) {
          this.notifications.set(res);
          this.unreadCount.set(res.filter(n => !n.read).length);
        }
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
      }
    });
  }

  markAllAsRead(role?: string) {
    const token = this.auth.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/read-all`;
    if (role) {
      url += `?role=${role}`;
    }
    this.http.post(url, {}, { headers }).subscribe({
      next: () => {
        this.loadNotifications(role);
      },
      error: (err) => {
        console.error('Failed to mark notifications as read', err);
      }
    });
  }
}
