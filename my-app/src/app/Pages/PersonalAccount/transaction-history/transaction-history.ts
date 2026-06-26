import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.css'
})
export class TransactionHistoryComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Active filter state: 'all' | 'deposit' | 'purchase'
  readonly currentFilter = signal<'all' | 'deposit' | 'purchase'>('all');

  // Time filter state: default "30 ngày qua"
  readonly timeFilter = signal<string>('30 ngày qua');

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Transactions list matching the screenshot
  readonly transactions = [
    {
      id: 'LB240901',
      date: '14/10/2024',
      time: '14:30',
      description: 'Mua sách "Muôn kiếp nhân sinh"',
      amount: -125000,
      type: 'purchase',
      status: 'success', // 'success' = Hoàn tất, 'pending' = Đang xử lý, 'cancelled' = Đã hủy
      statusText: 'Hoàn tất'
    },
    {
      id: 'LB240902',
      date: '12/10/2024',
      time: '09:15',
      description: 'Nạp tiền vào tài khoản (Momo)',
      amount: 500000,
      type: 'deposit',
      status: 'success',
      statusText: 'Hoàn tất'
    },
    {
      id: 'LB240903',
      date: '11/10/2024',
      time: '18:45',
      description: 'Gia hạn gói Member 6 tháng',
      amount: -299000,
      type: 'purchase',
      status: 'pending',
      statusText: 'Đang xử lý'
    },
    {
      id: 'LB240904',
      date: '08/10/2024',
      time: '21:20',
      description: 'Mua Audio Book "Dế Mèn Phiêu Lưu Ký"',
      amount: -85000,
      type: 'purchase',
      status: 'cancelled',
      statusText: 'Đã hủy'
    },
    {
      id: 'LB240905',
      date: '05/10/2024',
      time: '10:00',
      description: 'Khuyến mãi nạp đầu tháng',
      amount: 50000,
      type: 'deposit',
      status: 'success',
      statusText: 'Hoàn tất'
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

  // Filter selection
  setFilter(filter: 'all' | 'deposit' | 'purchase') {
    this.currentFilter.set(filter);
  }

  // Filtered transactions computed property (in TS)
  get filteredTransactions() {
    const filter = this.currentFilter();
    if (filter === 'all') {
      return this.transactions;
    }
    return this.transactions.filter(t => t.type === filter);
  }

  // Format money amount nicely
  formatAmount(amount: number): string {
    const sign = amount > 0 ? '+' : '-';
    const val = Math.abs(amount).toLocaleString('vi-VN');
    return `${sign} ${val}đ`;
  }

  // Simulate Pagination clicks
  onPageClick(page: number | string) {
    if (typeof page === 'number') {
      alert(`Chuyển đến trang ${page}`);
    }
  }
}
