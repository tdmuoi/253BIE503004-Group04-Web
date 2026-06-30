import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-achievement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievement.html',
  styleUrl: './achievement.css'
})
export class AchievementComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Statistics chart filter: 'month' | 'week'
  readonly chartFilter = signal<'month' | 'week'>('month');

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Stat metrics boxes
  readonly metrics = [
    { value: '3 năm 5 tháng', label: 'Bạn đã đồng hành', icon: 'calendar_today', type: 'companion' },
    { value: '0', label: 'Số sách đã đọc', icon: 'menu_book', type: 'read' },
    { value: '0', label: 'Số audio sách đã nghe', icon: 'headphones', type: 'audio' },
    { value: '0 phút', label: 'Thời gian đọc hôm nay', icon: 'schedule', type: 'read-today' },
    { value: '0 phút', label: 'Thời gian nghe hôm nay', icon: 'edit_document', type: 'write-today' },
    { value: '0 đ', label: 'Chi phí đã tiết kiệm', icon: 'savings', type: 'savings' }
  ];

  // Reading achievement badges
  readonly badges = [
    { 
      name: 'Người khai phá', 
      desc: 'đã mở 10 cuốn sách', 
      icon: 'explore', 
      active: true 
    },
    { 
      name: 'Dòng máu nóng', 
      desc: 'Đọc 7 ngày liên tiếp', 
      icon: 'local_fire_department', 
      active: false 
    },
    { 
      name: 'Ký giả', 
      desc: 'Đã viết 5 đánh giá', 
      icon: 'rate_review', 
      active: true 
    },
    { 
      name: 'Hàn lâm', 
      desc: 'Hoàn thành 1 combo sách', 
      icon: 'school', 
      active: false 
    },
    { 
      name: 'Kết nối', 
      desc: 'Chia sẻ 3 lần', 
      icon: 'share', 
      active: true 
    },
    { 
      name: 'Thần đèn', 
      desc: 'Đọc 1000 giờ', 
      icon: 'workspace_premium', 
      active: false 
    }
  ];

  // Sidebar navigation handler
  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  // Logout handler
  onLogout() {
    this.authService.logout();
  }

  // Toggle chart filter
  setChartFilter(filter: 'month' | 'week') {
    this.chartFilter.set(filter);
  }

  // Share achievements
  onShare() {
    alert('Đã sao chép liên kết thành tích đọc! Hãy chia sẻ với bạn bè nhé.');
  }
}
