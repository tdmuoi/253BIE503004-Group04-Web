import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../Services/auth.service';
  
@Component({
  selector: 'app-achievement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievement.html',
  styleUrl: './achievement.css'
})
export class AchievementComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
 
  // Statistics chart filter: 'month' | 'week'
  readonly chartFilter = signal<'month' | 'week'>('month');

  // Spend statistics signals
  readonly totalSpend = signal<number>(0);
  readonly successfulOrdersCount = signal<number>(0);
  readonly totalBooksCount = signal<number>(0);
  readonly maxOrderValue = signal<number>(0);
  readonly totalSavingsValue = signal<number>(0);
 
  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  ngOnInit() {
    this.loadAchievements();
  }

  loadAchievements() {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>(`http://localhost:3002/api/orders?t=${Date.now()}`, {
      headers
    }).subscribe({
      next: (res: any) => {
        const orders: any[] = Array.isArray(res) ? res : (res.orders || []);
        
        // Filter out only cancelled orders to count active purchases
        const activeOrders = orders.filter(o => {
          const status = (o.status || '').toLowerCase().trim();
          return status !== 'cancelled' && status !== 'đã hủy';
        });
        
        // 1. Calculate sum spent
        const totalSpend = activeOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0);
        
        // 2. Calculate sum books
        const totalBooks = activeOrders.reduce((sum, o) => {
          const qty = (o.items || []).reduce((s: number, item: any) => s + (item.quantity || 0), 0);
          return sum + qty;
        }, 0);
        
        // 3. Calculate max order
        const maxOrder = activeOrders.reduce((max, o) => Math.max(max, o.final_amount || 0), 0);
        
        // 4. Calculate total savings
        const totalSavings = activeOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
        
        // 5. Update metrics signals
        this.totalSpend.set(totalSpend);
        this.successfulOrdersCount.set(activeOrders.length);
        this.totalBooksCount.set(totalBooks);
        this.maxOrderValue.set(maxOrder);
        this.totalSavingsValue.set(totalSavings);

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading achievements:', err)
    });
  }

  // Stat metrics boxes (dynamic getters)
  get metrics() {
    return [
      { value: '3 năm 5 tháng', label: 'Bạn đã đồng hành', icon: 'calendar_today', type: 'companion' },
      { value: this.totalSpend().toLocaleString('vi-VN') + ' đ', label: 'Tổng chi tiêu mua sách', icon: 'savings', type: 'savings' },
      { value: this.successfulOrdersCount() + ' đơn', label: 'Đơn hàng thành công', icon: 'receipt_long', type: 'read' },
      { value: this.totalBooksCount() + ' cuốn', label: 'Số sách đã sở hữu', icon: 'menu_book', type: 'audio' },
      { value: this.maxOrderValue().toLocaleString('vi-VN') + ' đ', label: 'Đơn hàng lớn nhất', icon: 'payments', type: 'read-today' },
      { value: this.totalSavingsValue().toLocaleString('vi-VN') + ' đ', label: 'Chi phí đã tiết kiệm', icon: 'workspace_premium', type: 'write-today' }
    ];
  }

  // Spend rank tier
  get spendingRank(): string {
    const spend = this.totalSpend();
    if (spend >= 5000000) return 'Top 1% (Kim Cương)';
    if (spend >= 2000000) return 'Top 5% (Bạch Kim)';
    if (spend >= 1000000) return 'Top 15% (Vàng)';
    return 'Top 50% (Bạc)';
  }

  // Interactive spending chart dot coords
  get chartDotCoords() {
    const spend = this.totalSpend();
    if (spend >= 5000000) return { cx: 480, cy: 60 };
    if (spend >= 2000000) return { cx: 380, cy: 100 };
    if (spend >= 1000000) return { cx: 280, cy: 130 };
    return { cx: 180, cy: 160 };
  }

  // Reading achievement badges (purchasing conversion)
  get badges() {
    const spend = this.totalSpend();
    const orders = this.successfulOrdersCount();
    const books = this.totalBooksCount();

    return [
      { 
        name: 'Đồng độc giả', 
        desc: 'Gia nhập hội sách LightBooks', 
        icon: 'explore', 
        active: true 
      },
      { 
        name: 'Người sưu tầm', 
        desc: 'Mua trên 5 cuốn sách', 
        icon: 'local_fire_department', 
        active: books >= 5 
      },
      { 
        name: 'Nhà đầu tư tri thức', 
        desc: 'Tích lũy chi tiêu từ 1.000.000đ', 
        icon: 'rate_review', 
        active: spend >= 1000000 
      },
      { 
        name: 'Khách hàng thông thái', 
        desc: 'Mua thành công từ 5 đơn hàng', 
        icon: 'school', 
        active: orders >= 5 
      },
      { 
        name: 'Tín đồ sách', 
        desc: 'Tích lũy chi tiêu từ 2.000.000đ', 
        icon: 'share', 
        active: spend >= 2000000 
      },
      { 
        name: 'Đại phú tri thức', 
        desc: 'Tích lũy chi tiêu từ 5.000.000đ', 
        icon: 'workspace_premium', 
        active: spend >= 5000000 
      }
    ];
  }

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
