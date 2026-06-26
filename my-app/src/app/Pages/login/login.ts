import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

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
    email: ['', [Validators.required, Validators.email]],
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
  readonly books = [
    {
      image: '/img/books/phantom.jpg',
      badge: { text: '-20%', type: 'discount' },
      category: 'VĂN HỌC CỔ ĐIỂN',
      title: 'Bóng Ma Trong Nhà Hát (The Phantom of the Opera)',
      price: '156.000đ',
      originalPrice: '195.000đ'
    },
    {
      image: '/img/books/money.jpg',
      badge: null,
      category: 'PHÁT TRIỂN BẢN THÂN',
      title: 'Tâm Lý Học Về Tiền (The Psychology of Money)',
      price: '128.000đ',
      originalPrice: null
    },
    {
      image: '/img/books/cooking.jpg',
      badge: { text: 'MỚI', type: 'new' },
      category: 'ẨM THỰ & ĐỜI SỐNG',
      title: 'Nấu Ăn Cùng Thiên Nhiên - 100 Công Thức Mới',
      price: '245.000đ',
      originalPrice: null
    },
    {
      image: '/img/books/dune.jpg',
      badge: null,
      category: 'KHOA HỌC VIỄN TƯỞNG',
      title: 'Dune: Xứ Cát (Tập 1) - Frank Herbert',
      price: '189.000đ',
      originalPrice: null
    },
    {
      image: '/img/books/seagull.jpg',
      badge: { text: 'HOT', type: 'hot' },
      category: 'THIẾU NHI',
      title: 'Chuyện Con Mèo Dạy Hải Âu Bay',
      price: '65.000đ',
      originalPrice: null
    }
  ];

  ngOnInit(): void {
    // Redirect immediately if already logged in
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
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

  async submit(): Promise<void> {
    if (this.activeTab() === 'login') {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        this.statusMessage.set('Vui lòng nhập Email hợp lệ và mật khẩu tối thiểu 6 ký tự.');
        return;
      }

      this.loading.set(true);
      this.statusMessage.set(null);

      // Simulate Email Authentication
      setTimeout(() => {
        const { email } = this.loginForm.getRawValue();
        this.authService.loginWithEmail(email);
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      }, 1200);

    } else {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        this.statusMessage.set('Vui lòng nhập đúng SĐT (10 số), mã OTP (6 số) và mật khẩu.');
        return;
      }

      this.loading.set(true);
      this.statusMessage.set(null);

      // Simulate Registration / Phone Login
      setTimeout(() => {
        const { phone } = this.registerForm.getRawValue();
        this.authService.loginWithOtp(phone);
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      }, 1200);
    }
  }
}
