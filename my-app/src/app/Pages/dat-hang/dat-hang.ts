import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dat-hang',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dat-hang.html',
  styleUrl: './dat-hang.css',
})
export class DatHang {
  private readonly router = inject(Router);

  // Order Details State
  selectedShipping: string = 'standard'; // 'standard' or 'express'
  selectedPayment: string = 'cod'; // 'cod', 'transfer', or 'wallet'

  // Modal Flags
  showTransferModal: boolean = false;
  showWalletModal: boolean = false;

  // Static Details
  subtotal: number = 200000;
  discount: number = 0;

  get shippingPrice(): number {
    return this.selectedShipping === 'express' ? 55000 : 30000;
  }

  get totalPrice(): number {
    return this.subtotal + this.shippingPrice - this.discount;
  }

  selectShipping(method: string) {
    this.selectedShipping = method;
  }

  selectPayment(method: string) {
    this.selectedPayment = method;
    if (method === 'transfer') {
      this.showTransferModal = true;
    } else if (method === 'wallet') {
      this.showWalletModal = true;
    }
  }

  // Confirm Order Action
  onConfirmOrder() {
    if (this.selectedPayment === 'cod') {
      // For COD, proceed directly to success page
      this.navigateToSuccess();
    } else if (this.selectedPayment === 'transfer') {
      // Show Bank Transfer Modal
      this.showTransferModal = true;
    } else if (this.selectedPayment === 'wallet') {
      // Show E-wallet Modal
      this.showWalletModal = true;
    }
  }

  closeTransferModal() {
    this.showTransferModal = false;
  }

  closeWalletModal() {
    this.showWalletModal = false;
  }

  navigateToSuccess() {
    // Hide modals
    this.showTransferModal = false;
    this.showWalletModal = false;
    // Route to success page
    void this.router.navigate(['/dat-hang-thanh-cong']);
  }

  // Copy helper
  copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Đã sao chép ${label}: ${text}`);
    }).catch(err => {
      console.error('Không thể sao chép văn bản: ', err);
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert(`Đã sao chép ${label}: ${text}`);
      } catch (e) {
        alert(`Vui lòng sao chép thủ công: ${text}`);
      }
      document.body.removeChild(textarea);
    });
  }
}
