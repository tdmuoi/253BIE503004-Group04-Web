import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
 
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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-order-details.html',
  styleUrl: './admin-order-details.css'
})
export class AdminOrderDetailsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
 
  data: OrderDetail | null = null;
  loading = true;
 
  getGoogleMapsUrl(address: string): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
 
  // Edit Customer Modal properties
  showEditCustomerModal = false;
  editCustomerName = '';
  editCustomerEmail = '';
  editCustomerPhone = '';
  editCustomerAddress = '';

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

  printInvoice() {
    if (!this.data) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt mở popup để in hóa đơn.');
      return;
    }

    const itemsHtml = this.data.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (${item.type})</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toLocaleString()} VND</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${(item.price * item.quantity).toLocaleString()} VND</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <html>
      <head>
        <title>Hóa đơn ${this.data.orderId}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0b422e; padding-bottom: 10px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #0b422e; }
          .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .info-table td { padding: 4px 0; vertical-align: top; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th { background: #f2f5f3; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .total-section { float: right; width: 300px; margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .total-row.grand { font-size: 16px; font-weight: bold; border-top: 1px solid #333; padding-top: 8px; margin-top: 4px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">LIGHTBOOKS</div>
          <p>Nơi tri thức được tỏa sáng qua từng trang sách</p>
          <h2>HÓA ĐƠN BÁN HÀNG</h2>
          <p>Mã đơn hàng: <strong>${this.data.orderId}</strong> | Ngày đặt: ${new Date(this.data.placedOn).toLocaleDateString('vi-VN')}</p>
        </div>

        <table class="info-table">
          <tr>
            <td style="width: 50%;">
              <strong>Thông tin cửa hàng:</strong><br>
              LIGHTBOOKS Bookstore<br>
              Địa chỉ: Q. Thủ Đức, TP. Hồ Chí Minh<br>
              Hotline: 1900 6406
            </td>
            <td style="width: 50%;">
              <strong>Thông tin khách hàng:</strong><br>
              Họ tên: ${this.data.customer.name}<br>
              Số điện thoại: ${this.data.customer.phone}<br>
              Địa chỉ: ${this.data.customer.address}
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th style="text-align: center;">SL</th>
              <th style="text-align: right;">Đơn giá</th>
              <th style="text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Tạm tính:</span>
            <span>${this.data.payment.subtotal.toLocaleString()} VND</span>
          </div>
          <div class="total-row">
            <span>Phí vận chuyển:</span>
            <span>${this.data.payment.shippingFee.toLocaleString()} VND</span>
          </div>
          <div class="total-row">
            <span>Giảm giá:</span>
            <span>-${this.data.payment.discount.toLocaleString()} VND</span>
          </div>
          <div class="total-row grand">
            <span>Tổng cộng:</span>
            <span>${this.data.payment.total.toLocaleString()} VND</span>
          </div>
        </div>

        <div style="clear: both;"></div>

        <div class="footer">
          <p>Cảm ơn Quý khách đã mua sắm tại Lightbooks!</p>
          <p>Hóa đơn được in tự động từ hệ thống.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  }

  cancelOrder() {
    if (!this.data) return;

    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.')) {
      this.loading = true;
      this.http.put(`http://localhost:3002/api/admin/orders/${this.data.id}/status`, { status: 'Cancelled' }).subscribe({
        next: () => {
          alert('Hủy đơn hàng thành công!');
          this.loadOrderDetails(this.data!.id);
        },
        error: (err: any) => {
          console.error('Failed to cancel order', err);
          alert('Không thể hủy đơn hàng: ' + (err.error?.message || err.message));
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  openEditModal() {
    if (!this.data) return;
    this.editCustomerName = this.data.customer.name;
    this.editCustomerEmail = this.data.customer.email;
    this.editCustomerPhone = this.data.customer.phone;
    this.editCustomerAddress = this.data.customer.address;
    this.showEditCustomerModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.showEditCustomerModal = false;
    this.cdr.detectChanges();
  }

  saveCustomerInfo() {
    if (!this.data) return;

    this.loading = true;
    const body = {
      name: this.editCustomerName,
      email: this.editCustomerEmail,
      phone: this.editCustomerPhone,
      address: this.editCustomerAddress
    };

    this.http.put(`http://localhost:3002/api/admin/orders/${this.data.id}/customer`, body).subscribe({
      next: () => {
        alert('Cập nhật thông tin khách hàng thành công!');
        this.showEditCustomerModal = false;
        this.loadOrderDetails(this.data!.id);
      },
      error: (err: any) => {
        console.error('Failed to update customer details', err);
        alert('Không thể cập nhật thông tin: ' + (err.error?.message || err.message));
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
