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
  readonly transactions = signal<Transaction[]>([]);

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
        const txList = orders.map((order: any) => {
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
        this.transactions.set(txList);
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

  // Active page state
  readonly currentPage = signal<number>(1);
  readonly pageSize = 5;

  // Filter selection
  setFilter(filter: 'all' | 'deposit' | 'purchase') {
    this.currentFilter.set(filter);
    this.currentPage.set(1);
  }

  // Helper: Get all transactions matching the filter
  get allFilteredTransactions(): Transaction[] {
    const filter = this.currentFilter();
    const list = this.transactions();
    if (filter === 'all') {
      return list;
    }
    return list.filter(t => t.type === filter);
  }

  // Paginated subset of transactions
  get pagedTransactions(): Transaction[] {
    const list = this.allFilteredTransactions;
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  // Pagination getters
  get totalPages(): number {
    const total = this.allFilteredTransactions.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  get pages(): number[] {
    const total = this.totalPages;
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  }

  get displayStart(): number {
    if (this.allFilteredTransactions.length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  get displayEnd(): number {
    const end = this.currentPage() * this.pageSize;
    return Math.min(end, this.allFilteredTransactions.length);
  }

  // Format money amount nicely
  formatAmount(amount: number): string {
    const sign = amount > 0 ? '+' : '-';
    const val = Math.abs(amount).toLocaleString('vi-VN');
    return `${sign} ${val}đ`;
  }

  // Handle actual Pagination clicks
  onPageClick(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }
}
