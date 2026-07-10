import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
import { BookService } from '../../Services/book.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly bookService = inject(BookService);
  private readonly http = inject(HttpClient);

  // OTP Sending indicator
  readonly otpSending = signal<boolean>(false);

  // Screenshot-accurate modal visibility signals
  readonly showGoogleModal = signal<boolean>(false);
  readonly showFacebookModal = signal<boolean>(false);
  hideFBEmail: boolean = false;
  readonly showGoogleCustomForm = signal<boolean>(false);
  customGoogleEmail = '';
  customGooglePassword = '';

  // Track active tab: 'login' | 'register'
  readonly activeTab = signal<'login' | 'register'>('login');

  // Track chosen OTP verification method for registration: 'sms' | 'zalo'
  readonly otpVerificationMethod = signal<'sms' | 'zalo'>('sms');

  // Track password visibility
  readonly showPassword = signal<boolean>(false);
  
  // Track loading and submit status
  readonly loading = signal<boolean>(false);
  readonly statusMessage = signal<string | null>(null);

  // Form 1: Email Login Form (under "Đăng nhập" tab)
  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required]], // Remove email validator to support both email and phone input
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  // Form 2: Phone & OTP Register Form (under "Đăng ký" tab)
  readonly registerForm = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^(0[23456789][0-9]{8,9})$/)]],
    otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Recommendation Book List
  books: any[] = [];

  ngOnInit(): void {
    // Redirect immediately if already logged in
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }

    // Load recommendations from database
    this.bookService.getBooks().subscribe({
      next: (data) => {
        this.books = data.slice(0, 5).map(book => ({
          image: book.image,
          badge: book.discount_percent && book.discount_percent < 0 
            ? { text: `${book.discount_percent}%`, type: 'discount' } 
            : null,
          category: 'SÁCH NỔI BẬT',
          title: book.title,
          price: book.price_current.toLocaleString('vi-VN') + 'đ',
          originalPrice: book.price_old ? book.price_old.toLocaleString('vi-VN') + 'đ' : null
        }));
      },
      error: (err) => {
        console.error('Không thể lấy danh sách sách cho trang login:', err);
      }
    });
  }

  // Getters for Login Form
  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  // Getters for Register Form
  get phoneControl() {
    return this.registerForm.controls.phone;
  }

  get otpCodeControl() {
    return this.registerForm.controls.otpCode;
  }

  get registerPasswordControl() {
    return this.registerForm.controls.password;
  }

  setTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.statusMessage.set(null);
    this.showPassword.set(false);
  }

  setOtpMethod(method: 'sms' | 'zalo') {
    this.otpVerificationMethod.set(method);
  }

  togglePasswordVisibility() {
    this.showPassword.update(prev => !prev);
  }

  // Send simulated OTP from backend
  sendOtp() {
    const phone = this.phoneControl.value;
    if (!phone) {
      alert('Vui lòng nhập số điện thoại trước!');
      return;
    }
    if (this.phoneControl.invalid) {
      alert('Số điện thoại không hợp lệ (yêu cầu 10 chữ số bắt đầu bằng 0).');
      return;
    }

    this.otpSending.set(true);
    this.http.post('http://localhost:3002/api/otp/send', { phone, method: this.otpVerificationMethod() }).subscribe({
      next: (res: any) => {
        this.otpSending.set(false);
        if (res.otp) {
          alert(`[Môi trường Test] Đã gửi mã OTP thử nghiệm: ${res.otp}\nHệ thống đã tự điền mã vào ô bên dưới.`);
          this.registerForm.patchValue({ otpCode: res.otp });
        } else {
          alert(`Mã xác nhận OTP đã được gửi về số điện thoại ${phone} của bạn. Vui lòng kiểm tra tin nhắn SMS!`);
        }
      },
      error: (err) => {
        this.otpSending.set(false);
        alert('Gửi OTP thất bại: ' + (err.error?.error || err.message));
      }
    });
  }

  // Open simulated social login popup
  openSocialPopup(provider: string) {
    if (provider === 'google') {
      this.showGoogleModal.set(true);
    } else {
      this.showFacebookModal.set(true);
    }
  }

  closeGoogleModal() {
    this.showGoogleModal.set(false);
  }

  closeFacebookModal() {
    this.showFacebookModal.set(false);
  }

  selectGoogleAccount(email: string, name: string) {
    this.loading.set(true);
    this.authService.loginSocial(
      'google',
      email,
      name,
      'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(email)
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.showGoogleModal.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        alert('Đăng nhập Google thất bại: ' + (err.error?.error || err.message));
      }
    });
  }

  selectFacebookAccount() {
    if (this.hideFBEmail) {
      // Mock edge-case: Facebook does not return email
      alert('Không thể lấy email từ Facebook. Vui lòng sử dụng Google hoặc đăng ký bằng Email.');
      return;
    }

    this.loading.set(true);
    // Standard simulation: Facebook returns "Trần Huy" (trancanhnhathuy@gmail.com)
    this.authService.loginSocial(
      'facebook',
      'trancanhnhathuy@gmail.com',
      'Trần Huy',
      'https://api.dicebear.com/7.x/identicon/svg?seed=huy'
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.showFacebookModal.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        alert('Đăng nhập Facebook thất bại: ' + (err.error?.error || err.message));
      }
    });
  }

  async submit(): Promise<void> {
    if (this.activeTab() === 'login') {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        this.statusMessage.set('Vui lòng nhập Email hoặc SĐT hợp lệ và mật khẩu tối thiểu 6 ký tự.');
        return;
      }

      this.loading.set(true);
      this.statusMessage.set(null);

      const { email, password } = this.loginForm.getRawValue();
      this.authService.login(email, password).subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.statusMessage.set(err.error?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
      });

    } else {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        this.statusMessage.set('Vui lòng nhập đúng SĐT (10 số), mã OTP (6 số) và mật khẩu.');
        return;
      }

      this.loading.set(true);
      this.statusMessage.set(null);

      const { phone, password, otpCode } = this.registerForm.getRawValue();
      this.authService.register(phone, password, otpCode).subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.statusMessage.set(err.error?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
      });
    }
  }

  submitCustomGoogleAccount() {
    if (!this.customGoogleEmail) {
      alert('Vui lòng nhập địa chỉ Email!');
      return;
    }
    if (!this.customGooglePassword) {
      alert('Vui lòng nhập mật khẩu Gmail!');
      return;
    }

    this.loading.set(true);
    const name = this.customGoogleEmail.split('@')[0];
    this.authService.loginSocial(
      'google',
      this.customGoogleEmail,
      name,
      'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(this.customGoogleEmail)
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.showGoogleModal.set(false);
        this.showGoogleCustomForm.set(false);
        this.customGoogleEmail = '';
        this.customGooglePassword = '';
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        alert('Đăng nhập Google thất bại: ' + (err.error?.error || err.message));
      }
    });
  }
}
