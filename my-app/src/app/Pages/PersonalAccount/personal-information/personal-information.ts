import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-personal-information',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal-information.html',
  styleUrl: './personal-information.css'
})
export class PersonalInformationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  selectedAvatarBase64: string | null = null;

  // User details from AuthService
  get user() {
    return this.authService.currentUser() || {
      username: 'user1',
      email: 'user1@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  get avatarUrl(): string {
    return this.selectedAvatarBase64 || this.user.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user';
  }

  // Profile edit form
  readonly profileForm = this.fb.nonNullable.group({
    fullname: ['User One', [Validators.required]],
    username: [{ value: 'user1', disabled: true }],
    email: ['user1@gmail.com', [Validators.required, Validators.email]],
    phone: [''], // Optional
    dob: [''], // Optional
    gender: ['Nam', [Validators.required]]
  });

  ngOnInit(): void {
    const token = this.authService.getAccessToken();
    if (token) {
      this.http.get<any>('http://localhost:3002/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (res) => {
          const u = res.user;
          this.profileForm.patchValue({
            fullname: u.name || '',
            username: u.username || '',
            email: u.email || '',
            phone: u.phone || '',
            dob: u.dob ? u.dob.substring(0, 10) : '',
            gender: u.gender || 'Nam'
          });
        },
        error: (err) => console.error('Lỗi khi tải chi tiết profile:', err)
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Dung lượng ảnh tối đa là 1MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedAvatarBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Sidebar navigation handler
  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  // Logout handler
  onLogout() {
    this.authService.logout();
  }

  // Save changes
  onSubmit() {
    if (this.profileForm.invalid) {
      alert('Vui lòng nhập đầy đủ thông tin hợp lệ.');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      alert('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
      return;
    }

    const body: any = {
      name: this.profileForm.value.fullname,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,
      dob: this.profileForm.value.dob,
      gender: this.profileForm.value.gender
    };

    if (this.selectedAvatarBase64) {
      body.avatar = this.selectedAvatarBase64;
    }

    this.http.put('http://localhost:3002/api/auth/profile', body, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.authService.loadUserProfile().subscribe({
          next: () => {
            alert('Cập nhật thông tin cá nhân thành công!');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('user:updated'));
            }
          }
        });
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi cập nhật thông tin: ' + (err.error?.message || err.message));
      }
    });
  }
}
