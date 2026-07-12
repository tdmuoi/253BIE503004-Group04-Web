import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-customer-support',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-support.html',
  styleUrl: './customer-support.css'
})
export class CustomerSupportComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Active FAQ ID expanded (0 is open by default as in the screenshot)
  readonly activeFaqId = signal<number | null>(0);

  // Form group for sending offline messages
  readonly contactForm = this.fb.nonNullable.group({
    fullname: ['Nhất Huy', [Validators.required]],
    email: ['huy.nhat@example.com', [Validators.required, Validators.email]],
    subject: ['Vấn đề về thanh toán', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'user1',
      email: 'user1@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // FAQ list matching the screenshot
  readonly faqs = [
    {
      id: 0,
      icon: 'person',
      iconClass: 'profile-faq',
      question: 'Làm thế nào để thay đổi thông tin cá nhân?',
      answer: 'Để thay đổi thông tin cá nhân, bạn truy cập vào mục "Thông tin cá nhân" ở menu bên trái, chỉnh sửa các trường thông tin cần thiết rồi nhấn nút "Lưu thay đổi". Hệ thống sẽ cập nhật thông tin mới của bạn ngay lập tức.'
    },
    {
      id: 1,
      icon: 'credit_card',
      iconClass: 'payment-faq',
      question: 'Lightbook chấp nhận các phương thức thanh toán nào?',
      answer: 'Lightbook chấp nhận thanh toán qua ví điện tử Momo, ZaloPay, thẻ nội địa Napas, thẻ tín dụng Visa/Mastercard và chuyển khoản trực tiếp qua ngân hàng. Quy trình thanh toán được bảo mật an toàn 100%.'
    },
    {
      id: 2,
      icon: 'local_shipping',
      iconClass: 'order-faq',
      question: 'Tôi có thể hủy đơn hàng sau khi đã thanh toán không?',
      answer: 'Đối với sách vật lý, bạn có thể hủy đơn trong vòng 15-30 phút nếu đơn hàng ở trạng thái "Chờ xử lý" và chưa giao cho đơn vị vận chuyển. Đối với sách nói hoặc Ebook, sau khi giao dịch thành công bạn sẽ nhận quyền truy cập ngay lập tức nên không thể hoàn trả hay hủy bỏ.'
    }
  ];

  // Sidebar navigation handler
  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  // Logout handler
  onLogout() {
    this.authService.logout();
  }

  // Toggle Accordion open/close state
  toggleFaq(faqId: number) {
    if (this.activeFaqId() === faqId) {
      this.activeFaqId.set(null); // Close if clicked again
    } else {
      this.activeFaqId.set(faqId); // Open clicked item
    }
  }

  // Submit direct message
  onSubmit() {
    if (this.contactForm.invalid) {
      alert('Vui lòng điền đầy đủ và đúng định dạng thông tin liên hệ!');
      return;
    }
    
    const formData = this.contactForm.value;
    alert(`Cảm ơn bạn, ${formData.fullname}!\nYêu cầu hỗ trợ về "${formData.subject}" đã được ghi nhận. Chúng tôi sẽ phản hồi lại bạn qua email ${formData.email} sớm nhất.`);
    this.contactForm.patchValue({ message: '' }); // Clear message textarea after submit
  }

  // Quick Support Click Actions
  onLiveChat() {
    alert('Đang kết nối tới chuyên viên hỗ trợ trực tuyến Lightbook...');
  }

  onSendMail() {
    window.location.href = 'mailto:support@lb.vn?subject=Hỗ trợ khách hàng Lightbook';
  }

  onCallHotline() {
    alert('Gọi Hotline: 1900 1234 (Cước phí 1000đ/phút)');
  }
}
