import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookService } from '../../Services/book.service';
import { AuthService } from '../../Services/auth.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-books-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './books-detail.html',
  styleUrl: './books-detail.css'
})
export class BooksDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  book: any = null;
  loading: boolean = true;
  error: string | null = null;
  
  quantity: number = 1;
  currentImage: string = '';
  toastMessage: string = '';
  showToast: boolean = false;

  // Similar books from Fahasa reference
  // Similar books from Fahasa reference
  suggestedBooks: any[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const bookId = params.get('id');
      if (bookId) {
        this.fetchBook(bookId);
      } else {
        // Fallback for testing layout if no ID provided
        this.book = {
          title: 'Tiếng Sét Ái Tình Ở Xóm Gà',
          author: 'Christian Jolibois, Christian Heinrich',
          supplier: 'Nhã Nam',
          publisher: 'NXB Hà Nội',
          translator: 'Minh Phúc, Quốc Bảo',
          year: '2021',
          weight: '96',
          dimensions: '19 x 14.5 x 0.4 cm',
          pages: '48',
          format: 'Bìa Mềm',
          price_current: 46000,
          price_old: 58000,
          discount_percent: 20,
          image: 'https://cdn0.fahasa.com/media/catalog/product/i/m/image_195509_1_25272.jpg',
          description: 'Ôi có chuyện gì xảy ra với Carmelito vậy? Cậu đột nhiên thấy trái tim mình thổn thức, chân cẳng run lẩy bẩy...'
        };
        this.currentImage = this.book.image;
        this.loading = false;
        this.loadSuggestions();
      }
    });
  }

  loadSuggestions() {
    this.bookService.getBooks().subscribe({
      next: (books) => {
        // Lọc cuốn sách hiện tại ra khỏi danh sách gợi ý
        const currentId = this.book?._id || this.book?.id;
        const filtered = books.filter(b => b._id !== currentId && b.id !== currentId);
        
        // Trộn ngẫu nhiên (hoặc chỉ lấy 4 cuốn đầu tiên)
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);
        
        this.suggestedBooks = selected.map(b => ({
          _id: b._id || b.id || '',
          title: b.title,
          author: b.author,
          price: b.price_current ? b.price_current.toLocaleString('vi-VN') : '0',
          oldPrice: b.price_old ? b.price_old.toLocaleString('vi-VN') + ' đ' : null,
          discount: b.discount_percent ? `-${b.discount_percent}%` : null,
          img: b.image || 'https://bizweb.dktcdn.net/thumb/large/100/363/455/products/bia-sach-web-59.png?v=1781174581793'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi khi tải sách gợi ý:', err)
    });
  }

  fetchBook(id: string) {
    console.log(`[BooksDetail] fetchBook called with id: "${id}"`);
    this.loading = true;
 
    // Thử lấy từ /api/books trước, nếu lỗi thì thử /api/products, cuối cùng thử /api/old-books
    this.bookService.getBookById(id).subscribe({
      next: (data) => {
        console.log(`[BooksDetail] getBookById next received:`, data);
        if (!data || Object.keys(data).length === 0) {
          this.fetchFromProducts(id);
          return;
        }
        this.setBook(data);
      },
      error: (err) => {
        console.warn('[BooksDetail] /api/books thất bại, thử /api/products:', err);
        this.fetchFromProducts(id);
      }
    });
  }
 
  fetchFromProducts(id: string) {
    this.http.get<any>(`http://localhost:3002/api/products/${id}`).subscribe({
      next: (data) => {
        if (!data || Object.keys(data).length === 0) {
          // Thử tiếp với old-books
          this.fetchFromOldBooks(id);
          return;
        }
        if (!data.price_current) data.price_current = data.price || 0;
        this.setBook(data);
      },
      error: (err) => {
        console.warn('[BooksDetail] /api/products thất bại, thử /api/old-books:', err);
        this.fetchFromOldBooks(id);
      }
    });
  }

  fetchFromOldBooks(id: string) {
    this.http.get<any>(`http://localhost:3002/api/old-books/${id}`).subscribe({
      next: (data) => {
        if (!data || Object.keys(data).length === 0) {
          this.error = 'Không tìm thấy sách này.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        // Normalize fields từ old_books schema sang schema dùng trong template
        const normalized = {
          ...data,
          title: data.name || data.title || '',
          image: data.thumbnail || data.image || '',
          price_current: data.current_price || 0,
          price_old: data.original_price || null,
          discount_percent: data.original_price && data.current_price
            ? Math.round((1 - data.current_price / data.original_price) * 100)
            : null,
        };
        this.setBook(normalized);
      },
      error: (err) => {
        console.error('[BooksDetail] Lỗi khi tải thông tin sách cũ:', err);
        this.error = 'Không thể tải thông tin sách. Vui lòng thử lại sau.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
 
  setBook(data: any) {
    this.book = data;
    if (!this.book.price_current && this.book.price) {
      this.book.price_current = this.book.price;
    }
    this.currentImage = data.image || data.url || 'https://via.placeholder.com/400x500?text=No+Image';
    this.loading = false;
    console.log(`[BooksDetail] Book loaded:`, this.book.title);
    this.loadSuggestions();
    
    // Tải danh sách đánh giá
    const currentId = this.book._id || this.book.id;
    if (currentId) {
      this.loadReviews(currentId);
    }
    
    this.cdr.detectChanges();
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  setMainImage(imgUrl: string) {
    this.currentImage = imgUrl;
  }

  addToCart() {
    if (!this.book) return;

    const cartItem = {
      _id: this.book._id || this.book.id || null,
      name: this.book.title,
      title: this.book.title,
      author: this.book.author || '',
      price: this.book.price_current || this.book.price || 0,
      qty: this.quantity,
      quantity: this.quantity,
      img: this.book.image || this.book.url || '',
      image: this.book.image || this.book.url || ''
    };

    // 1. Lưu vào localStorage (cho khách vãng lai và đồng bộ local)
    const raw = localStorage.getItem('cart_items');
    let items: any[] = [];
    try { items = raw ? JSON.parse(raw) : []; } catch { items = []; }

    const existing = items.findIndex((i: any) => i._id && i._id === cartItem._id);
    if (existing >= 0) {
      items[existing].qty = (items[existing].qty || 0) + this.quantity;
      items[existing].quantity = items[existing].qty;
    } else {
      items.push(cartItem);
    }
    localStorage.setItem('cart_items', JSON.stringify(items));

    // 2. Nếu đã đăng nhập, đồng bộ lên server
    const user = this.authService.currentUser();
    if (user) {
      this.http.post('http://localhost:3002/api/carts', { items }, {
        headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
      }).subscribe({
        next: () => console.log('Đã đồng bộ giỏ hàng lên server'),
        error: (err) => console.error('Lỗi đồng bộ giỏ hàng:', err)
      });
    }

    // 3. Kích hoạt cập nhật header
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cart:updated'));
    }

    // 4. Hiện thông báo toast
    this.showToastMessage('✅ Đã thêm vào giỏ hàng!');
  }

  buyNow() {
    this.addToCart();
    void this.router.navigate(['/cart']);
  }

  showToastMessage(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 2500);
  }

  // --- REVIEW SYSTEM STATE ---
  reviews: any[] = [];
  averageScore = 0;
  totalReviews = 0;
  ratingDistribution = [0, 0, 0, 0, 0]; // Index 0 is 1 star, Index 4 is 5 stars
  
  ratingInput = 5;
  contentInput = '';
  submittingReview = false;

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  loadReviews(productId: string) {
    this.http.get<any[]>(`http://localhost:3002/api/reviews?productId=${productId}`).subscribe({
      next: (data) => {
        this.reviews = data || [];
        this.calculateStats();
      },
      error: (err) => console.error('Lỗi khi tải đánh giá:', err)
    });
  }

  calculateStats() {
    this.totalReviews = this.reviews.length;
    if (this.totalReviews === 0) {
      this.averageScore = 0;
      this.ratingDistribution = [0, 0, 0, 0, 0];
      this.cdr.detectChanges();
      return;
    }

    let sum = 0;
    const dist = [0, 0, 0, 0, 0];
    this.reviews.forEach(rev => {
      const r = Math.max(1, Math.min(5, Math.floor(Number(rev.rating || 5))));
      sum += r;
      dist[r - 1]++;
    });

    this.averageScore = parseFloat((sum / this.totalReviews).toFixed(1));
    this.ratingDistribution = dist;
    this.cdr.detectChanges();
  }

  getStarPercentage(star: number): string {
    if (this.totalReviews === 0) return '0%';
    const count = this.ratingDistribution[star - 1];
    return Math.round((count / this.totalReviews) * 100) + '%';
  }

  submitReview() {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để viết đánh giá!');
      return;
    }
    const currentId = this.book?._id || this.book?.id;
    if (!currentId) return;

    if (!this.contentInput.trim()) {
      alert('Vui lòng nhập nội dung bình luận!');
      return;
    }

    this.submittingReview = true;
    const userObj = this.authService.currentUser();
    const payload = {
      productId: String(currentId),
      username: userObj?.name || userObj?.username || 'Thành viên',
      avatar: userObj?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user',
      rating: this.ratingInput,
      content: this.contentInput.trim()
    };

    this.http.post('http://localhost:3002/api/reviews', payload).subscribe({
      next: () => {
        this.submittingReview = false;
        this.contentInput = '';
        this.ratingInput = 5;
        this.loadReviews(currentId);
        this.showToastMessage('✅ Gửi đánh giá thành công!');
      },
      error: (err) => {
        this.submittingReview = false;
        alert('Gửi đánh giá thất bại: ' + (err.error?.error || err.message));
      }
    });
  }

  getRelativeTime(dateString: any): string {
    if (!dateString) return 'Vừa xong';
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
