import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardPage implements OnInit {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
 
  readonly shelfBooks = signal<any[]>([]);
  readonly isLoading = signal<boolean>(true);

  // Getter for the current logged-in user
  get user() {
    return this.authService.currentUser();
  }
 
  ngOnInit(): void {
    // Route guard: Redirect to login if not authenticated
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.loadBooks();
  }

  loadBooks() {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.isLoading.set(false);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('http://localhost:3002/api/personal-books', { headers }).subscribe({
      next: (data) => {
        this.shelfBooks.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải tủ sách cá nhân:', err);
        this.isLoading.set(false);
      }
    });
  }
 
  goToStore(): void {
    void this.router.navigate(['/sach-dien-tu']);
  }

  goToPersonalBookshelf(): void {
    void this.router.navigate(['/PersonalAccount/personal-bookshelf']);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
