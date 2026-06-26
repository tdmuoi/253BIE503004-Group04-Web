import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-management.html',
  styleUrl: './order-management.css'
})
export class OrderManagementComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Active filter tab: 'all' | 'confirming' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
  readonly currentFilter = signal<'all' | 'confirming' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'>('all');

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // List of order items
  readonly orders = [
    {
      id: '#LB123456',
      date: '24/05/2024',
      status: 'shipping',
      statusLabel: 'Đang giao',
      items: [
        { 
          title: 'The Great Gatsby', 
          author: 'F. Scott Fitzgerald', 
          qty: 1, 
          price: '150.000đ', 
          image: '/img/books/money.jpg' 
        },
        { 
          title: '1984', 
          author: 'George Orwell', 
          qty: 1, 
          price: '125.000đ', 
          image: '/img/books/phantom.jpg' 
        }
      ],
      total: '275.000đ'
    },
    {
      id: '#LB123440',
      date: '18/05/2024',
      status: 'delivered',
      statusLabel: 'Đã giao',
      items: [
        { 
          title: 'Rừng Na Uy', 
          author: 'Haruki Murakami', 
          qty: 1, 
          price: '189.000đ', 
          image: '/img/books/cooking.jpg' 
        }
      ],
      total: '189.000đ'
    }
  ];

  // Filter orders listing
  get filteredOrders() {
    const filter = this.currentFilter();
    if (filter === 'all') return this.orders;
    return this.orders.filter(order => order.status === filter);
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
  setFilter(filter: 'all' | 'confirming' | 'preparing' | 'shipping' | 'delivered' | 'cancelled') {
    this.currentFilter.set(filter);
  }

  // Actions
  onTrackOrder(id: string) {
    alert(`Đang lấy thông tin vận đơn cho mã đơn hàng: ${id}. Vui lòng chờ...`);
  }

  onViewDetails(id: string) {
    alert(`Mở chi tiết đơn hàng: ${id}`);
  }

  onFilterClick() {
    alert('Bộ lọc nâng cao (Khoảng ngày, giá trị,...) đang được xây dựng!');
  }
}
