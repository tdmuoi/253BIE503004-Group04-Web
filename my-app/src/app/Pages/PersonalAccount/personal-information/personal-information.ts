import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-personal-information',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal-information.html',
  styleUrl: './personal-information.css'
})
export class PersonalInformationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // User details from AuthService
  get user() {
    return this.authService.currentUser() || {
      username: 'user1',
      email: 'user1@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Profile edit form
  readonly profileForm = this.fb.nonNullable.group({
    fullname: ['User One', [Validators.required]],
    username: [{ value: 'user1', disabled: true }],
    email: ['user1@gmail.com', [Validators.required, Validators.email]],
    phone: ['098 **** 217', [Validators.required]],
    dob: ['1995-10-24', [Validators.required]], // ISO format for date picker
    gender: ['Nam', [Validators.required]]
  });

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
    alert('Đã cập nhật thông tin cá nhân thành công!');
  }
}
