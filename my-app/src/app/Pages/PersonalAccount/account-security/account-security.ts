import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

interface LoginSession {
  id: string;
  device: string;
  location: string;
  time: string;
  active: boolean;
}

@Component({
  selector: 'app-account-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-security.html',
  styleUrl: './account-security.css'
})
export class AccountSecurityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Two factor authentication toggle state
  readonly is2faEnabled = signal<boolean>(false);

  // Password change reactive form
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Login session records
  readonly sessions = signal<LoginSession[]>([
    {
      id: 'SESS01',
      device: 'Chrome trên Windows PC',
      location: 'Thành phố Hồ Chí Minh, Việt Nam',
      time: 'Đang hoạt động',
      active: true
    },
    {
      id: 'SESS02',
      device: 'Safari trên iPhone 14',
      location: 'Thành phố Hồ Chí Minh, Việt Nam',
      time: 'Hoạt động 2 giờ trước',
      active: false
    }
  ]);

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Sidebar navigation handler
  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  // Logout handler
  onLogout() {
    this.authService.logout();
  }

  // Toggle 2FA switch
  toggle2fa() {
    const nextState = !this.is2faEnabled();
    this.is2faEnabled.set(nextState);
    if (nextState) {
      alert('Đã kích hoạt xác thực 2 lớp (2FA)! Mã xác thực sẽ được gửi qua số điện thoại đăng ký khi đăng nhập.');
    } else {
      alert('Đã tắt xác thực 2 lớp (2FA).');
    }
  }

  // Change password submit
  onSubmitPassword() {
    if (this.passwordForm.invalid) {
      alert('Vui lòng nhập mật khẩu hợp lệ (tối thiểu 6 ký tự).');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và mật khẩu xác nhận không khớp nhau!');
      return;
    }

    if (currentPassword === newPassword) {
      alert('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    alert('Đã cập nhật mật khẩu tài khoản thành công!');
    this.passwordForm.reset();
  }

  // Terminate device sessions
  terminateOtherSessions() {
    if (confirm('Bạn có muốn đăng xuất tài khoản khỏi tất cả các thiết bị khác không?')) {
      const activeOnly = this.sessions().filter(s => s.active);
      this.sessions.set(activeOnly);
      alert('Đã đăng xuất khỏi các thiết bị khác thành công!');
    }
  }
}
