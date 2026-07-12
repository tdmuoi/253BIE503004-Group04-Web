import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CustomerResponse {
  summary: {
    totalUsers: number;
    activeUsers: number;
    repurchaseRate: number;
    avgSpend: number;
  };
  customers: {
    id: string;
    cusId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    orderCount: number;
    totalSpend: number;
    createdAt: string;
  }[];
  total: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-customers.html',
  styleUrl: './admin-customers.css'
})
export class AdminCustomersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  data: CustomerResponse | null = null;
  loading = true;

  searchQuery = '';
  statusFilter = 'All';
  currentPage = 1;

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    let url = `http://localhost:3002/api/admin/customers?page=${this.currentPage}&limit=10`;
    if (this.statusFilter !== 'All') {
      url += `&status=${this.statusFilter.toLowerCase()}`;
    }
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }

    this.http.get<CustomerResponse>(url).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load customers list', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadCustomers();
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadCustomers();
  }

  changePage(page: number) {
    if (page >= 1 && page <= (this.data?.totalPages || 1)) {
      this.currentPage = page;
      this.loadCustomers();
    }
  }

  getPagesArray(): number[] {
    if (!this.data) return [];
    return Array.from({ length: this.data.totalPages }, (_, i) => i + 1);
  }
}
