import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

interface CustomerDetail {
  id: string;
  cusId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar: string;
  createdAt: string;
  stats: {
    totalSpend: number;
    orderCount: number;
    completedCount: number;
    pendingCount: number;
    cancelledCount: number;
  };
  orders: {
    id: string;
    orderId: string;
    placedOn: string;
    total: number;
    paymentMethod: string;
    status: string;
  }[];
}

@Component({
  selector: 'app-admin-customer-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-customer-details.html',
  styleUrl: './admin-customer-details.css'
})
export class AdminCustomerDetailsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  data: CustomerDetail | null = null;
  loading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCustomerDetails(id);
      }
    });
  }

  loadCustomerDetails(id: string) {
    this.loading = true;
    this.http.get<CustomerDetail>(`http://localhost:3002/api/admin/customers/${id}`).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load customer details', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    void this.router.navigate(['/admin/customers']);
  }
}
