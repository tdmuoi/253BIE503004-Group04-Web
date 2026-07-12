import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { NotificationService } from '../../../Services/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly notiService = inject(NotificationService);

  isNotiDropdownOpen = false;

  private notiTimeoutId: any;

  onNotiMouseEnter() {
    if (this.notiTimeoutId) {
      clearTimeout(this.notiTimeoutId);
    }
  }

  onNotiMouseLeave() {
    this.notiTimeoutId = setTimeout(() => {
      this.isNotiDropdownOpen = false;
    }, 1200);
  }

  ngOnInit() {
    this.notiService.loadNotifications('admin');
  }

  toggleNotiDropdown(event: Event) {
    event.stopPropagation();
    this.isNotiDropdownOpen = !this.isNotiDropdownOpen;
    if (this.isNotiDropdownOpen) {
      this.notiService.loadNotifications('admin');
    }
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notiService.markAllAsRead('admin');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
