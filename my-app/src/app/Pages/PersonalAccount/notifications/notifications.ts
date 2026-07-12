import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { NotificationService } from '../../../Services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly notiService = inject(NotificationService);

  activeTab: 'all' | 'unread' = 'all';

  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  ngOnInit() {
    this.notiService.loadNotifications();
  }

  setTab(tab: 'all' | 'unread') {
    this.activeTab = tab;
  }

  get filteredNotifications() {
    const list = this.notiService.notifications();
    if (this.activeTab === 'unread') {
      return list.filter(n => !n.read);
    }
    return list;
  }

  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  onLogout() {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  markAllAsRead() {
    this.notiService.markAllAsRead();
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${diffDay} ngày trước`;
  }
}
