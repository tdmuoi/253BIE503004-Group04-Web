import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../Services/auth.service';

interface OrderItem {
  product_id?: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  fullname: string;
  phone: string;
  email: string;
  shipping_address: string;
  shipping_method: string;
  payment_method: string;
  items: OrderItem[];
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-management.html',
  styleUrl: './order-management.css'
})
export class OrderManagementComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  // Active filter tab: 'all' | 'confirming' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
  readonly currentFilter = signal<string>('all');

  // User details
  get user() {
    return this.authService.currentUser() || {
      id: null,
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Dynamic list of orders
  orders: Order[] = [];

  // Modal details
  selectedOrder: Order | null = null;
  showDetailsModal: boolean = false;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    const currentUser = this.authService.currentUser();
    let url = 'http://localhost:3002/api/orders';
    if (currentUser) {
      if (currentUser.id) {
        url += `?user_id=${currentUser.id}`;
      } else if (currentUser.email) {
        url += `?email=${currentUser.email}`;
      }
    }

    this.http.get<Order[]>(url).subscribe({
      next: (res) => {
        this.orders = res;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách đơn hàng:', err);
      }
    });
  }

  // Filter orders listing
  get filteredOrders() {
    const filter = this.currentFilter();
    if (filter === 'all') return this.orders;
    return this.orders.filter(order => order.status === filter);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirming': return 'Chờ xác nhận';
      case 'preparing': return 'Chờ lấy hàng';
      case 'shipping': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
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

  // Set filter value
  setFilter(filter: string) {
    this.currentFilter.set(filter);
  }

  // Actions
  onTrackOrder(id: string) {
    alert(`Đang lấy thông tin vận đơn cho mã đơn hàng: ${id}. Vui lòng chờ...`);
  }

  onViewDetails(id: string) {
    // Find order in our current list
    const order = this.orders.find(o => o._id === id);
    if (order) {
      this.selectedOrder = order;
      this.showDetailsModal = true;
    } else {
      // Fetch details from API
      this.http.get<Order>(`http://localhost:3002/api/orders/${id}`).subscribe({
        next: (res) => {
          this.selectedOrder = res;
          this.showDetailsModal = true;
        },
        error: (err) => {
          console.error('Không tìm thấy chi tiết đơn hàng:', err);
          alert('Không thể lấy chi tiết đơn hàng.');
        }
      });
    }
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedOrder = null;
  }

  onFilterClick() {
    alert('Bộ lọc nâng cao (Khoảng ngày, giá trị,...) đang được xây dựng!');
  }
}
