import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dat-hang-thanh-cong',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dat-hang-thanh-cong.html',
  styleUrl: './dat-hang-thanh-cong.css',
})
export class DatHangThanhCong implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  orderId: string = '';
  deliveryDate: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] || '';
    });

    // Calculate delivery date (3 days from now)
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = dayNames[date.getDay()];
    const dateString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    this.deliveryDate = `${dayName}, ${dateString}`;
  }

  onContinueShopping() {
    // Navigate back to the dashboard / bookstore homepage
    void this.router.navigate(['/dashboard']);
  }
}
