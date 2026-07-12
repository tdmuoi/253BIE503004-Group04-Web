import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface DashboardData {
  metrics: {
    totalRevenue: number;
    newOrders: number;
    totalUsers: number;
    pendingReturns: number;
  };
  salesPerformance: { day: string; value: number }[];
  hotCategories: { name: string; percentage: number }[];
  recentOrders: {
    id: string;
    orderId: string;
    customerName: string;
    customerAvatar: string;
    date: string;
    total: number;
    status: string;
  }[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  data: DashboardData | null = null;
  loading = true;

  ngOnInit() {
    console.log('AdminDashboardComponent ngOnInit called!');
    this.http.get<DashboardData>('http://localhost:3002/api/admin/dashboard').subscribe({
      next: (res) => {
        console.log('AdminDashboardComponent API success. Data:', res);
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        console.error('AdminDashboardComponent API failed!', err);
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }

  getBarHeightPercent(value: number): number {
    if (!this.data || !this.data.salesPerformance) return 0;
    const maxVal = Math.max(...this.data.salesPerformance.map(s => s.value)) || 1000000;
    // Map to a percentage (0 - 100)
    return (value / maxVal) * 100;
  }
}
