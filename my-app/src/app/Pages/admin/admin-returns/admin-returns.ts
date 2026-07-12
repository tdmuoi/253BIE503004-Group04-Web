import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface ReturnsData {
  summary: {
    pendingReturns: number;
    approvedRequests: number;
    rejectedItems: number;
    totalRefundValue: number;
  };
  requests: {
    id: string;
    formattedId: string;
    customer: {
      name: string;
      initials: string;
    };
    product: {
      name: string;
      image: string;
    };
    reason: string;
    value: number;
    status: string;
    createdAt: string;
    action?: string;
  }[];
  insights: {
    defectiveItems: number;
    changeOfMind: number;
    incorrectOrder: number;
  };
}

@Component({
  selector: 'app-admin-returns',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-returns.html',
  styleUrl: './admin-returns.css'
})
export class AdminReturnsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  data: ReturnsData | null = null;
  loading = true;

  activeTab = 'Tất cả';
  tabs = ['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'Từ chối'];

  ngOnInit() {
    this.loadReturns();
  }

  loadReturns() {
    this.loading = true;
    this.http.get<ReturnsData>('http://localhost:3002/api/admin/returns').subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load returns data', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  getFilteredRequests() {
    if (!this.data) return [];
    if (this.activeTab === 'Tất cả') return this.data.requests;
    if (this.activeTab === 'Chờ duyệt') return this.data.requests.filter(r => r.status === 'Pending');
    if (this.activeTab === 'Đã duyệt') return this.data.requests.filter(r => r.status === 'Completed');
    if (this.activeTab === 'Từ chối') return this.data.requests.filter(r => r.status === 'Rejected');
    return this.data.requests;
  }

  updateStatus(id: string, status: string) {
    this.http.put(`http://localhost:3002/api/admin/returns/${id}/status`, { status }).subscribe({
      next: () => {
        this.loadReturns();
      },
      error: (err) => {
        console.error('Failed to update liquidation status', err);
      }
    });
  }
}
