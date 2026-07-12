import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';

interface OrderDetail {
  id: string;
  orderId: string;
  placedOn: string;
  status: string;
  timeline: {
    pending: string | null;
    packed: string | null;
    shipping: string | null;
    delivered: string | null;
  };
  items: {
    id: string;
    name: string;
    author: string;
    type: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    avatar: string;
  };
  payment: {
    method: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    status: string;
  };
  trackingEvents: {
    status: string;
    time: string;
  }[];
}

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-order-details.html',
  styleUrl: './admin-order-details.css'
})
export class AdminOrderDetailsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  data: OrderDetail | null = null;
  loading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadOrderDetails(id);
      }
    });
  }

  loadOrderDetails(id: string) {
    this.loading = true;
    this.http.get<OrderDetail>(`http://localhost:3002/api/admin/orders/${id}`).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        console.error('Failed to load order details', err);
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }
}
