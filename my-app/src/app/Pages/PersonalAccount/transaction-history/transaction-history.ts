import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../Services/auth.service';

interface Transaction {
  id: string;
  _id?: string;
  date: string;
  time: string;
  description: string;
  amount: number;
  type: 'purchase' | 'deposit';
  status: 'success' | 'pending' | 'cancelled';
  statusText: string;
}

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.css'
})
export class TransactionHistoryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

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

  // Transactions list
  transactions: Transaction[] = [];

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('Chưa đăng nhập, không thể tải lịch sử giao dịch.');
      return;
    }

    // Lấy đơn hàng từ API, rồi chuyển thành transaction
    this.http.get<any>(`http://localhost:3002/api/orders?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res: any) => {
        const orders: any[] = Array.isArray(res) ? res : (res.orders || []);
        this.transactions = orders.map((order: any) => {
          const dateObj = new Date(order.createdAt || Date.now());
          const status = this.mapOrderStatus(order.status || 'confirming');
          const itemTitles = (order.items || []).map((i: any) => i.title).join(', ');
          return {
            id: order._id || order.id || 'N/A',
            _id: order._id,
            date: dateObj.toLocaleDateString('vi-VN'),
            time: dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            description: itemTitles ? `Mua sách "${itemTitles}"` : 'Mua sách',
            amount: -(order.final_amount || 0),
            type: 'purchase' as 'purchase',
            status: status.code as 'success' | 'pending' | 'cancelled',
            statusText: status.label
          };
        });
      },
      error: (err) => {
        console.error('Lỗi khi tải lịch sử giao dịch:', err);
      }
    });
  }

  mapOrderStatus(status: string): { code: string; label: string } {
    switch (status) {
      case 'delivered': return { code: 'success', label: 'Hoàn tất' };
      case 'cancelled': return { code: 'cancelled', label: 'Đã hủy' };
      case 'confirming':
      case 'preparing':
      case 'shipping':
      default: return { code: 'pending', label: 'Đang xử lý' };
    }
  }

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
