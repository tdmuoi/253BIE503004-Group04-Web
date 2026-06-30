import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dat-hang-thanh-cong',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dat-hang-thanh-cong.html',
  styleUrl: './dat-hang-thanh-cong.css',
})
export class DatHangThanhCong {
  private readonly router = inject(Router);

  onContinueShopping() {
    // Navigate back to the dashboard / bookstore homepage
    void this.router.navigate(['/dashboard']);
  }
}
