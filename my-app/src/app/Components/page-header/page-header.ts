import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../Services/notification.service';
import { AuthService } from '../../Services/auth.service';

const CART_KEY = 'cart_items';
const USER_KEY = 'lightbooks_user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  readonly notiService = inject(NotificationService);
  private readonly auth = inject(AuthService);

  isCategoriesMenuOpen = false;
  activeCategoryIndex = 0;
  cartCount = 0;
  currentUser: any = null;
  isUserDropdownOpen = false;
  isNotiDropdownOpen = false;
  showLogoutModal = false;
  showLoginRequiredModal = false;

  searchQuery = '';

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/sach-dien-tu'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  readonly categories = [
    {
      name: 'Sách Mới',
      subcategories: [
        {
          name: 'VĂN HỌC',
          items: [
            { name: 'Tiểu Thuyết', icon: 'bi-heart-fill' },
            { name: 'Truyện Ngắn - Tản Văn', icon: 'bi-chat-quote-fill' },
            { name: 'Light Novel', icon: 'bi-star-fill' },
            { name: 'Ngôn Tình', icon: 'bi-balloon-heart-fill' },
            { name: 'Trinh Thám', icon: 'bi-eye-slash-fill' }
          ]
        },
        {
          name: 'KINH TẾ',
          items: [
            { name: 'Nhân Vật - Bài Học Kinh Doanh', icon: 'bi-person-badge-fill' },
            { name: 'Quản Trị - Lãnh Đạo', icon: 'bi-people-fill' },
            { name: 'Marketing - Bán Hàng', icon: 'bi-cart-check-fill' },
            { name: 'Phân Tích Kinh Tế', icon: 'bi-graph-up-arrow' }
          ]
        },
        {
          name: 'TÂM LÝ - KĨ NĂNG SỐNG',
          items: [
            { name: 'Kỹ Năng Sống', icon: 'bi-activity' },
            { name: 'Rèn Luyện Nhân Cách', icon: 'bi-gem' },
            { name: 'Tâm Lý', icon: 'bi-brain-fill' },
            { name: 'Sách Cho Tuổi Mới Lớn', icon: 'bi-brightness-high-fill' }
          ]
        },
        {
          name: 'SÁCH THIẾU NHI',
          items: [
            { name: 'Manga - Comic', icon: 'bi-images' },
            { name: 'Kiến Thức Bách Khoa', icon: 'bi-globe2' },
            { name: 'Sách Tranh Kỹ Năng Sống', icon: 'bi-brush-fill' },
            { name: 'Vừa Học - Vừa Chơi', icon: 'bi-puzzle-fill' }
          ]
        },
        {
          name: 'TIỂU SỬ - HỒI KÝ',
          items: [
            { name: 'Câu Chuyện Cuộc Đời', icon: 'bi-book-half' },
            { name: 'Chính Trị', icon: 'bi-bank2' },
            { name: 'Kinh Tế', icon: 'bi-cash-coin' },
            { name: 'Nghệ Thuật - Giải Trí', icon: 'bi-controller' }
          ]
        }
      ]
    },
    {
      name: 'Sách Cũ',
      subcategories: [
        {
          name: 'VĂN HỌC KINH ĐIỂN',
          items: [
            { name: 'Văn Học Việt Nam', icon: 'bi-mortarboard-fill' },
            { name: 'Văn Học Nước Ngoài', icon: 'bi-translate' },
            { name: 'Thơ - Kịch Cổ Điển', icon: 'bi-flower1' },
            { name: 'Tác Phẩm Đoạt Giải', icon: 'bi-trophy-fill' }
          ]
        },
        {
          name: 'LỊCH SỬ - ĐỊA LÝ',
          items: [
            { name: 'Lịch Sử Việt Nam', icon: 'bi-flag-fill' },
            { name: 'Lịch Sử Thế Giới', icon: 'bi-compass-fill' },
            { name: 'Địa Lý & Du Khảo', icon: 'bi-map-fill' },
            { name: 'Tư Liệu Cổ - Hiếm', icon: 'bi-journal-medical' }
          ]
        },
        {
          name: 'KHOA HỌC - KỸ THUẬT',
          items: [
            { name: 'Toán Học - Vật Lý', icon: 'bi-calculator-fill' },
            { name: 'Y Học Cổ Truyền', icon: 'bi-droplet-fill' },
            { name: 'Cơ Khí - Bách Khoa', icon: 'bi-nut-fill' },
            { name: 'Nông - Lâm - Ngư Nghiệp', icon: 'bi-tree-fill' }
          ]
        },
        {
          name: 'GIÁO TRÌNH - TÀI LIỆU',
          items: [
            { name: 'Sách Giáo Khoa Cũ', icon: 'bi-journal-bookmark-fill' },
            { name: 'Giáo Trình Đại Học', icon: 'bi-journal-text' },
            { name: 'Tài Liệu Nghiên Cứu', icon: 'bi-search' },
            { name: 'Từ Điển - Sách Tra Cứu', icon: 'bi-spellcheck' }
          ]
        },
        {
          name: 'SƯU TẦM & ĐẶC BIỆT',
          items: [
            { name: 'Ấn Bản Giới Hạn', icon: 'bi-patch-check-fill' },
            { name: 'Sách Ký Tặng', icon: 'bi-pen-fill' },
            { name: 'Tạp Chí Xưa', icon: 'bi-newspaper' },
            { name: 'Sách Hán Nôm', icon: 'bi-feather' }
          ]
        }
      ]
    },
    {
      name: 'Ebook',
      subcategories: [
        {
          name: 'VĂN HỌC & TIỂU THUYẾT',
          items: [
            { name: 'E-Novel', icon: 'bi-tablet-fill' },
            { name: 'Trinh Thám - Kinh Dị', icon: 'bi-ghost' },
            { name: 'Khoa Học Viễn Tưởng', icon: 'bi-rocket-takeoff-fill' },
            { name: 'Ngôn Tình & Lãng Mạn', icon: 'bi-suit-heart-fill' }
          ]
        },
        {
          name: 'PHÁT TRIỂN BẢN THÂN',
          items: [
            { name: 'Sách Nói (Audiobook)', icon: 'bi-headphones' },
            { name: 'Kỹ Năng Làm Việc', icon: 'bi-briefcase-fill' },
            { name: 'Nghệ Thuật Sống Đẹp', icon: 'bi-sun-fill' },
            { name: 'Tư Duy Sáng Tạo', icon: 'bi-lightbulb-fill' }
          ]
        },
        {
          name: 'HỌC NGOẠI NGỮ',
          items: [
            { name: 'Giáo Trình Tiếng Anh', icon: 'bi-alphabet-uppercase' },
            { name: 'Tài Liệu IELTS/TOEFL', icon: 'bi-file-earmark-pdf-fill' },
            { name: 'Tiếng Nhật - JLPT', icon: 'bi-translate' },
            { name: 'Tiếng Trung - HSK', icon: 'bi-chat-dots-fill' }
          ]
        },
        {
          name: 'CÔNG NGHỆ - TIN HỌC',
          items: [
            { name: 'Lập Trình Web/App', icon: 'bi-code-slash' },
            { name: 'Trí Tuệ Nhân Tạo (AI)', icon: 'bi-cpu-fill' },
            { name: 'Thiết Kế Đồ Họa', icon: 'bi-palette-fill' },
            { name: 'An Toàn Thông Tin', icon: 'bi-shield-lock-fill' }
          ]
        },
        {
          name: 'KHOA HỌC & CUỘC SỐNG',
          items: [
            { name: 'Vũ Trụ - Thiên Văn', icon: 'bi-stars' },
            { name: 'Sức Khỏe - Dinh Dưỡng', icon: 'bi-heart-pulse-fill' },
            { name: 'Tâm Lý Học Ứng Dụng', icon: 'bi-hash' },
            { name: 'Bản Tin Công Nghệ', icon: 'bi-rss-fill' }
          ]
        }
      ]
    }
  ];

  toggleCategoriesMenu(event: Event): void {
    event.stopPropagation();
    this.isCategoriesMenuOpen = !this.isCategoriesMenuOpen;
    if (this.isCategoriesMenuOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  selectCategory(index: number, event: Event): void {
    event.stopPropagation();
    this.activeCategoryIndex = index;
  }

  closeCategoriesMenu(): void {
    this.isCategoriesMenuOpen = false;
  }

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
      if (this.currentUser) {
        this.notiService.loadNotifications();
      }
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
    this.auth.logout();
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

  private userTimeoutId: any;
  private notiTimeoutId: any;

  onUserMouseEnter(): void {
    if (this.userTimeoutId) {
      clearTimeout(this.userTimeoutId);
    }
  }

  onUserMouseLeave(): void {
    this.userTimeoutId = setTimeout(() => {
      this.isUserDropdownOpen = false;
      this.cdr.detectChanges();
    }, 1200);
  }

  onNotiMouseEnter(): void {
    if (this.notiTimeoutId) {
      clearTimeout(this.notiTimeoutId);
    }
  }

  onNotiMouseLeave(): void {
    this.notiTimeoutId = setTimeout(() => {
      this.isNotiDropdownOpen = false;
      this.cdr.detectChanges();
    }, 1200);
  }

  toggleNotificationsDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.currentUser) {
      this.showLoginRequiredModal = true;
      return;
    }
    this.isNotiDropdownOpen = !this.isNotiDropdownOpen;
    if (this.isNotiDropdownOpen) {
      this.notiService.loadNotifications();
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notiService.markAllAsRead();
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${diffDay} ngày trước`;
  }
}
