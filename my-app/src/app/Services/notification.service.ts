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

  loadNotifications() {
    const token = this.auth.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<Notification[]>(this.apiUrl, { headers }).subscribe({
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

  markAllAsRead() {
    const token = this.auth.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.post(`${this.apiUrl}/read-all`, {}, { headers }).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Failed to mark notifications as read', err);
      }
    });
  }
}
