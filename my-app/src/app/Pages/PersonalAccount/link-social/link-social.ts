import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-link-social',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './link-social.html',
  styleUrl: './link-social.css'
})
export class LinkSocialComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // States of social connection links
  readonly facebookLinked = signal<boolean>(false);
  readonly googleLinked = signal<boolean>(true);
  readonly appleLinked = signal<boolean>(false);
  readonly zaloLinked = signal<boolean>(true);

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

  // Social linking toggles
  toggleFacebook() {
    if (this.facebookLinked()) {
      if (confirm('Bạn có muốn hủy liên kết với tài khoản Facebook không?')) {
        this.facebookLinked.set(false);
        alert('Đã hủy liên kết Facebook thành công.');
      }
    } else {
      this.facebookLinked.set(true);
      alert('Đã liên kết tài khoản Lightbook với Facebook của Nhất Huy.');
    }
  }

  toggleGoogle() {
    if (this.googleLinked()) {
      if (confirm('Bạn có muốn hủy liên kết với tài khoản Google không?')) {
        this.googleLinked.set(false);
        alert('Đã hủy liên kết Google thành công.');
      }
    } else {
      this.googleLinked.set(true);
      alert('Đã liên kết tài khoản Lightbook với Google nhathuy.ux@gmail.com.');
    }
  }

  toggleApple() {
    if (this.appleLinked()) {
      if (confirm('Bạn có muốn hủy liên kết với tài khoản Apple không?')) {
        this.appleLinked.set(false);
        alert('Đã hủy liên kết Apple thành công.');
      }
    } else {
      this.appleLinked.set(true);
      alert('Đã liên kết tài khoản Lightbook với Apple ID.');
    }
  }

  toggleZalo() {
    if (this.zaloLinked()) {
      if (confirm('Bạn có muốn hủy liên kết với tài khoản Zalo không?')) {
        this.zaloLinked.set(false);
        alert('Đã hủy liên kết Zalo thành công.');
      }
    } else {
      this.zaloLinked.set(true);
      alert('Đã liên kết tài khoản Lightbook với tài khoản Zalo cá nhân.');
    }
  }
}
