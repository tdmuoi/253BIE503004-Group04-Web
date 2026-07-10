import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';

interface CartItem {
  name: string;
  author: string;
  price: number;
  quantity: number;
  img: string;
  _id?: string;
}

@Component({
  selector: 'app-dat-hang',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dat-hang.html',
  styleUrl: './dat-hang.css',
})
export class DatHang implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Order Details State
  selectedShipping: string = 'standard'; // 'standard' or 'express'
  selectedPayment: string = 'cod'; // 'cod', 'transfer', or 'wallet'

  // Modal Flags
  showTransferModal: boolean = false;
  showWalletModal: boolean = false;
  isEditingShipping: boolean = false; // Toggle editing mode

  // Shipping details
  fullname: string = 'Nguyễn Anh Thư';
  phone: string = '0901234567';
  email: string = 'anthu.ng@email.com';
  address: string = '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh';

  // Dynamic Cart Details
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  discount: number = 0;

  get shippingPrice(): number {
    return this.selectedShipping === 'express' ? 55000 : 30000;
  }

  get totalPrice(): number {
    return this.subtotal + this.shippingPrice - this.discount;
  }

  ngOnInit() {
    // 1. Load shipping info from localStorage if set in cart page
    const cachedShipping = localStorage.getItem('checkout_shipping_info');
    if (cachedShipping) {
      try {
        const info = JSON.parse(cachedShipping);
        this.fullname = info.fullname || this.fullname;
        this.phone = info.phone || this.phone;
        this.email = info.email || this.email;
        this.address = info.address || this.address;
      } catch (e) {
        console.error('Lỗi khi đọc shipping info:', e);
      }
    } else {
      // Fallback: load from logged-in user
      const user = this.authService.currentUser();
      if (user) {
        this.fullname = user.username || this.fullname;
        this.email = user.email || this.email;
        this.phone = user.phone || this.phone;
        this.address = user.address || this.address;
      }
    }

    // 2. Load cart items from localStorage
    const rawCart = localStorage.getItem('cart_items');
    if (rawCart) {
      try {
        const arr = JSON.parse(rawCart);
        if (Array.isArray(arr)) {
          this.cartItems = arr.map(item => ({
            name: item.name || item.title || '',
            author: item.author || '',
            price: item.price || item.price_current || 0,
            quantity: item.qty || item.quantity || 1,
            img: item.img || item.image || '',
            _id: item._id
          }));
          this.subtotal = this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        }
      } catch (e) {
        console.error('Lỗi khi đọc giỏ hàng:', e);
      }
    }
  }

  toggleEditShipping() {
    this.isEditingShipping = !this.isEditingShipping;
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
    // Construct Order Payload
    const user = this.authService.currentUser();
    const orderItems = this.cartItems.map(item => ({
      product_id: item._id || null,
      title: item.name,
      image: item.img,
      price: item.price,
      quantity: item.quantity
    }));

    const orderData = {
      user_id: user ? user.id : null,
      fullname: this.fullname,
      phone: this.phone,
      email: this.email,
      shipping_address: this.address,
      shipping_method: this.selectedShipping,
      payment_method: this.selectedPayment,
      items: orderItems,
      total_amount: this.subtotal,
      shipping_fee: this.shippingPrice,
      discount_amount: this.discount,
      final_amount: this.totalPrice
    };

    // Post to backend database
    this.http.post('http://localhost:3002/api/orders', orderData).subscribe({
      next: (res) => {
        console.log('Đặt hàng thành công:', res);
        // Clear cart
        localStorage.removeItem('cart_items');
        localStorage.removeItem('checkout_shipping_info');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart:updated'));
        }
        this.navigateToSuccess();
      },
      error: (err) => {
        console.error('Lỗi khi đặt hàng:', err);
        alert('Đặt hàng thất bại. Vui lòng thử lại.');
      }
    });
  }

  closeTransferModal() {
    this.showTransferModal = false;
  }

  closeWalletModal() {
    this.showWalletModal = false;
  }

  navigateToSuccess() {
    this.showTransferModal = false;
    this.showWalletModal = false;
    void this.router.navigate(['/dat-hang-thanh-cong']);
  }

  copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Đã sao chép ${label}: ${text}`);
    }).catch(err => {
      console.error('Không thể sao chép: ', err);
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
