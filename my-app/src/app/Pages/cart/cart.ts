import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { HttpClient } from '@angular/common/http';

interface CartItem {
  name: string;
  author: string;
  price: number;
  quantity: number;
  img: string;
  _id?: string; // MongoDB book ID if available
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  products: CartItem[] = [];
  shippingPrice: number = 30000;

  // Delivery Form Bindings
  fullname: string = 'Nguyễn Anh Thư';
  phone: string = '0901234567';
  email: string = 'anthu.ng@email.com';
  address: string = '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh';

  get subtotal(): number {
    return this.products.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }

  get totalPrice(): number {
    return this.products.length > 0 ? this.subtotal + this.shippingPrice : 0;
  }

  ngOnInit() {
    // Prefill delivery info from logged-in user if available
    const user = this.authService.currentUser();
    if (user) {
      this.fullname = user.username || '';
      this.email = user.email || '';
      this.phone = user.phone || '';
      this.address = user.address || '';
    }

    this.loadCart();
  }

  loadCart() {
    // Luôn load từ localStorage trước để hiển thị ngay lập tức
    this.loadFromLocalStorage();

    const user = this.authService.currentUser();
    if (user) {
      // Sau đó thử đồng bộ từ server (chỉ dùng nếu server có dữ liệu)
      this.http.get<{items: any[]}>('http://localhost:3002/api/carts', {
        headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
      }).subscribe({
        next: (res) => {
          if (res.items && res.items.length > 0) {
            // Server có dữ liệu → dùng server (ưu tiên)
            this.products = res.items.map(item => ({
              name: item.title || item.name,
              author: item.author || '',
              price: item.price || 0,
              quantity: item.qty || item.quantity || 1,
              img: item.image || item.img || '',
              _id: item._id || null
            }));
            // Đồng bộ lại localStorage
            this.syncLocalStorage();
          } else if (this.products.length > 0) {
            // Server rỗng nhưng localStorage có data → đồng bộ localStorage lên server
            const toSave = this.products.map(p => ({
              title: p.name,
              author: p.author,
              price: p.price,
              quantity: p.quantity,
              image: p.img,
              _id: p._id
            }));
            this.http.post('http://localhost:3002/api/carts', { items: toSave }, {
              headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
            }).subscribe({
              next: () => console.log('Đã đồng bộ localStorage lên server'),
              error: (err) => console.error('Lỗi đồng bộ:', err)
            });
          }
        },
        error: (err) => {
          // Nếu API lỗi, giữ nguyên localStorage đã load
          console.error('Lỗi khi tải giỏ hàng từ server (sẽ dùng localStorage):', err);
        }
      });
    }
  }

  loadFromLocalStorage() {
    const rawCart = localStorage.getItem('cart_items');
    if (rawCart) {
      try {
        const arr = JSON.parse(rawCart);
        if (Array.isArray(arr)) {
          this.products = arr.map(item => ({
            name: item.name || item.title,
            author: item.author || '',
            price: item.price || item.price_current || 0,
            quantity: item.qty || item.quantity || 1,
            img: item.img || item.image || '',
            _id: item._id || null
          }));
        }
      } catch (e) {
        console.error('Lỗi khi đọc giỏ hàng từ localStorage:', e);
      }
    }
  }

  syncLocalStorage() {
    const toSave = this.products.map(p => ({
      title: p.name,
      name: p.name,
      author: p.author,
      price: p.price,
      qty: p.quantity,
      quantity: p.quantity,
      image: p.img,
      img: p.img,
      _id: p._id
    }));
    localStorage.setItem('cart_items', JSON.stringify(toSave));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cart:updated'));
    }
  }

  saveCart() {
    this.syncLocalStorage();
    const user = this.authService.currentUser();
    if (user) {
      // Sync to backend if logged in
      const toSave = this.products.map(p => ({
        title: p.name,
        author: p.author,
        price: p.price,
        quantity: p.quantity,
        image: p.img,
        _id: p._id
      }));
      this.http.post('http://localhost:3002/api/carts', { items: toSave }, {
        headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
      }).subscribe({
        next: () => console.log('Đã đồng bộ giỏ hàng lên server'),
        error: (err) => console.error('Lỗi khi đồng bộ giỏ hàng:', err)
      });
    }
  }

  increaseQty(index: number) {
    this.products[index].quantity += 1;
    this.saveCart();
  }

  decreaseQty(index: number) {
    if (this.products[index].quantity > 1) {
      this.products[index].quantity -= 1;
      this.saveCart();
    }
  }

  deleteItem(index: number) {
    this.products.splice(index, 1);
    this.saveCart();
  }

  onCheckout() {
    // Save current checkout delivery info to local storage
    const shippingInfo = {
      fullname: this.fullname,
      phone: this.phone,
      email: this.email,
      address: this.address
    };
    localStorage.setItem('checkout_shipping_info', JSON.stringify(shippingInfo));
    void this.router.navigate(['/dat-hang']);
  }
}
