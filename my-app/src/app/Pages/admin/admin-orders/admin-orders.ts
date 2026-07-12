import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface OrderResponse {
  summary: {
    totalOrders: number;
    processing: number;
    returns: number;
  };
  orders: {
    id: string;
    orderId: string;
    customer: {
      name: string;
      email: string;
      initials: string;
    };
    date: string;
    total: number;
    status: string;
    deliveryAgency?: string;
  }[];
  total: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  data: OrderResponse | null = null;
  loading = true;

  activeTab = 'All Orders';
  tabs = ['All Orders', 'Pending', 'Shipped', 'Completed'];
  searchQuery = '';
  currentPage = 1;

  // Edit Modal State
  editingOrder: any | null = null;
  updating = false;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    let url = `http://localhost:3002/api/admin/orders-list?page=${this.currentPage}&limit=10`;
    if (this.activeTab !== 'All Orders') {
      url += `&status=${this.activeTab}`;
    }
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }

    this.http.get<OrderResponse>(url).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadOrders();
  }

  changePage(page: number) {
    if (page >= 1 && page <= (this.data?.totalPages || 1)) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  getPagesArray(): number[] {
    if (!this.data) return [];
    return Array.from({ length: this.data.totalPages }, (_, i) => i + 1);
  }

  viewDetails(orderId: string) {
    void this.router.navigate(['/admin/orders', orderId]);
  }

  openEditModal(order: any) {
    this.editingOrder = {
      id: order.id,
      orderId: order.orderId,
      customerName: order.customer.name,
      status: order.status,
      deliveryAgency: order.deliveryAgency || ''
    };
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.editingOrder = null;
    this.cdr.detectChanges();
  }

  saveOrderChanges() {
    if (!this.editingOrder) return;
    this.updating = true;
    this.cdr.detectChanges();

    const url = `http://localhost:3002/api/admin/orders/${this.editingOrder.id}/status`;
    const body = {
      status: this.editingOrder.status,
      deliveryAgency: this.editingOrder.deliveryAgency
    };

    this.http.put(url, body).subscribe({
      next: () => {
        this.updating = false;
        this.editingOrder = null;
        this.loadOrders(); // Refresh table
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update order status', err);
        this.updating = false;
        this.cdr.detectChanges();
        alert('Cập nhật trạng thái đơn hàng thất bại. Vui lòng thử lại!');
      }
    });
  }

  // Add New Order Modal States and Handlers
  showAddModal = false;
  newOrderData = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    total: 0,
    status: 'Pending'
  };

  openAddModal() {
    this.newOrderData = {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      total: 0,
      status: 'Pending'
    };
    this.showAddModal = true;
    this.cdr.detectChanges();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.cdr.detectChanges();
  }

  saveNewOrder() {
    if (!this.newOrderData.customerName || !this.newOrderData.customerEmail) {
      alert('Vui lòng nhập Tên và Email khách hàng!');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.http.post('http://localhost:3002/api/admin/orders', this.newOrderData).subscribe({
      next: () => {
        this.showAddModal = false;
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed to create order', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('Tạo đơn hàng thất bại. Vui lòng kiểm tra lại!');
      }
    });
  }

  exportToCSV() {
    if (!this.data || !this.data.orders.length) {
      alert('Không có dữ liệu đơn hàng để xuất!');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Total', 'Status', 'Delivery Agency'];
    const rows = this.data.orders.map(o => [
      o.orderId,
      o.customer.name,
      o.customer.email,
      o.date,
      o.total,
      o.status,
      o.deliveryAgency || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LightBooks_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
