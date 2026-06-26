import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  // Getter for the current logged-in user
  get user() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    // Route guard: Redirect to login if not authenticated
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
