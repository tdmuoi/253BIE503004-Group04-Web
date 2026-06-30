import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

const CART_KEY = 'cart_items';
const USER_KEY = 'lightbooks_user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  cartCount = 0;
  currentUser: any = null;
  isUserDropdownOpen = false;
  showLogoutModal = false;
  showLoginRequiredModal = false;

  private cartUpdatedHandler = () => this.updateCartBadge();
  private userUpdatedHandler = () => this.updateUser();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.updateCartBadge();
    this.updateUser();
    if (typeof window !== 'undefined') {
      window.addEventListener('cart:updated', this.cartUpdatedHandler);
      window.addEventListener('user:updated', this.userUpdatedHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('cart:updated', this.cartUpdatedHandler);
      window.removeEventListener('user:updated', this.userUpdatedHandler);
    }
  }

  private updateCartBadge(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let count = 0;
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const it of arr) count += Math.max(0, Number((it as any).qty ?? 1));
        }
      }
    } catch (_) {}
    this.cartCount = count;
    this.cdr.detectChanges();
  }

  private updateUser(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(USER_KEY);
      this.currentUser = raw ? JSON.parse(raw) : null;
    } catch (_) {
      this.currentUser = null;
    }
    this.cdr.detectChanges();
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.currentUser) {
      this.showLoginRequiredModal = true;
      return;
    }
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  onCartClick(event: Event): void {
    if (!this.currentUser) {
      event.preventDefault();
      this.showLoginRequiredModal = true;
    }
  }

  confirmLogout(): void {
    this.showLogoutModal = true;
    this.isUserDropdownOpen = false;
  }

  doLogout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(USER_KEY);
    }
    this.currentUser = null;
    this.showLogoutModal = false;
    this.router.navigate(['/']);
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  closeLoginRequiredModal(): void {
    this.showLoginRequiredModal = false;
  }

  goToLogin(): void {
    this.showLoginRequiredModal = false;
    this.router.navigate(['/login']);
  }
}