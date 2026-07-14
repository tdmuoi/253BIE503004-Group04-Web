import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookService } from '../../Services/book.service';
import { AuthService } from '../../Services/auth.service';


interface Product {
  _id?: string;
  title: string;
  author: string;
  img: string;
  price: string;
  oldPrice?: string;
  discount?: string;
}

@Component({
  selector: 'app-homepage',
  imports: [RouterLink],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // ── Flash sale countdown ──
  readonly hh = signal('00');
  readonly mm = signal('00');
  readonly ss = signal('00');
  private remaining = 46 * 60 + 12; // 00:46:12
  private timer?: ReturnType<typeof setInterval>;
  
  // ── Suggestions limit ──
  visibleSuggestionsLimit = 40;

  loadMoreSuggestions(): void {
    this.visibleSuggestionsLimit += 40;
  }

  // ── Search category chips ──
  readonly searchCats = [
    { name: 'Tiểu thuyết', id: 'vanHoc' },
    { name: 'Tâm lý', id: 'tamLyKyNang' },
    { name: 'Kinh tế', id: 'kinhTe' },
    { name: 'Manga', id: 'thieuNhi' },
    { name: 'Thiếu nhi', id: 'thieuNhi' },
    { name: 'Lịch sử', id: 'tieuSuHoiKy' }
  ];

  // ── Flash sale products ──
  flashSale: Product[] = [];

  // ── New releases ──
  newBooks: Product[] = [];

  // ── Best sellers this week ──
  bestSellers: (Product & { rank: string })[] = [];

  // ── Combos ──
  combos: Product[] = [];

  // ── Featured Book ──
  featuredBook: Product | null = null;



  // ── Suggestions grid ──
  suggestions: Product[] = [];

  // ── News ──
  news: any[] = [];
  
  private readonly fallbackNews = [
    { id: 'n1', tag: 'SỰ KIỆN', title: 'Ngày hội đọc sách LightBook 2026', desc: 'Khám phá hương thềm trị mở trong ngày đọc sách năm.', img: 'img/news/news_festival_cover.jpg' },
    { id: 'n2', tag: 'CẢM HỨNG', title: 'Lợi ích của việc đọc sách buổi sáng', desc: 'Vì sao đọc sách buổi sáng giúp bạn cả ngày tỉnh táo và tốt cho não bộ.', img: 'img/news/news_morning_reading.jpg' },
    { id: 'n3', tag: 'XU HƯỚNG', title: 'Sự trỗi dậy của thiết kế bìa sách tối giản', desc: 'Khám phá xu hướng thềm trị mở trong xuất bản hiện nay.', img: 'img/news/news_minimalist_cover.jpg' },
  ];

  ngOnInit(): void {
    this.render();
    this.timer = setInterval(() => {
      this.remaining = this.remaining > 0 ? this.remaining - 1 : 0;
      this.render();
    }, 1000);

    // Lấy tin tức từ backend API
    this.bookService.getNews().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.news = data;
        } else {
          this.news = this.fallbackNews;
        }
      },
      error: (err) => {
        console.warn('Không thể lấy tin tức từ backend, dùng dữ liệu dự phòng:', err);
        this.news = this.fallbackNews;
      }
    });

    // Lấy dữ liệu sách từ backend API
    this.bookService.getBooks().subscribe({
      next: (books) => {
        console.log('API returned books length:', books.length);
        const mappedProducts: Product[] = books.map(book => ({
          _id: book._id ? String(book._id) : String((book as any).id || ''),
          title: book.title,
          author: book.author,
          img: book.image || book.url || '',
          price: (book.price_current || 0).toLocaleString('vi-VN') + 'đ',
          oldPrice: book.price_old ? book.price_old.toLocaleString('vi-VN') + 'đ' : undefined,
          discount: book.discount_percent ? `${book.discount_percent}%` : undefined
        }));
        console.log('Mapped products length:', mappedProducts.length);

        // suggestions lấy tất cả các sách
        this.suggestions = mappedProducts;

        // newBooks lấy 4 cuốn đầu tiên
        this.newBooks = mappedProducts.slice(0, 4);

        // flashSale lấy các cuốn sách có giảm giá (ví dụ discount_percent < 0 hoặc có discount_percent)
        this.flashSale = books
          .filter(book => book.discount_percent && book.discount_percent < 0)
          .map(book => ({
            _id: book._id,
            title: book.title,
            author: book.author,
            img: book.image || book.url || '',
            price: (book.price_current || 0).toLocaleString('vi-VN') + 'đ',
            oldPrice: book.price_old ? book.price_old.toLocaleString('vi-VN') + 'đ' : undefined,
            discount: `${book.discount_percent}%`
          }))
          .slice(0, 4);

        // bestSellers lấy sách ngẫu nhiên hoặc top 3
        this.bestSellers = mappedProducts.slice(4, 7).map((p, idx) => ({
          ...p,
          rank: `0${idx + 1}`
        }));

        // featuredBook lấy 1 sách đặc biệt
        this.featuredBook = mappedProducts[8] || null;

        // combos lấy 3 sách
        this.combos = mappedProducts.slice(10, 13);
      },
      error: (err) => {
        console.error('Không thể lấy danh sách sách từ backend:', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private render(): void {
    const h = Math.floor(this.remaining / 3600);
    const m = Math.floor((this.remaining % 3600) / 60);
    const s = this.remaining % 60;
    this.hh.set(String(h).padStart(2, '0'));
    this.mm.set(String(m).padStart(2, '0'));
    this.ss.set(String(s).padStart(2, '0'));
  }

  addToCart(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.bookService.getBooks().subscribe({
      next: (books) => {
        const fullBook = books.find(b => b._id === product._id || (b as any).id === product._id);
        if (fullBook) {
          const cartItem = {
            _id: fullBook._id,
            title: fullBook.title,
            author: fullBook.author,
            price: fullBook.price_current,
            img: fullBook.image || fullBook.url || '',
            qty: 1,
            quantity: 1
          };
          this.saveToCart(cartItem);
        }
      }
    });
  }

  private saveToCart(cartItem: any): void {
    let raw = null;
    if (typeof window !== 'undefined') {
      raw = localStorage.getItem('cart_items');
    }
    let items: any[] = [];
    try { items = raw ? JSON.parse(raw) : []; } catch { items = []; }

    const existing = items.findIndex((i: any) => i._id && i._id === cartItem._id);
    if (existing >= 0) {
      items[existing].qty = (items[existing].qty || 0) + 1;
      items[existing].quantity = items[existing].qty;
    } else {
      items.push(cartItem);
    }
    localStorage.setItem('cart_items', JSON.stringify(items));

    const user = this.authService.currentUser();
    if (user) {
      this.http.post('http://localhost:3002/api/carts', { items }, {
        headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
      }).subscribe({
        next: () => console.log('Đã đồng bộ giỏ hàng lên server'),
        error: (err) => console.error('Lỗi đồng bộ giỏ hàng:', err)
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cart:updated'));
    }

    alert('✅ Đã thêm vào giỏ hàng thành công!');
  }
}
