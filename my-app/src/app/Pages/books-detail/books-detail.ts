import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookService } from '../../Services/book.service';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-books-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  suggestedBooks = [
    { title: 'Chúc mừng sinh nhật cậu', price: '116.000', oldPrice: '145.000', discount: '-20%', img: 'https://bizweb.dktcdn.net/thumb/large/100/363/455/products/bia-sach-web-59.png?v=1781174581793', author: 'Guido Van Genechten' },
    { title: 'Combo Hũ Cảm Xúc Và Hũ Tình Bạn', price: '142.400', oldPrice: '178.000', discount: '-20%', img: 'https://bizweb.dktcdn.net/thumb/large/100/363/455/products/bia-sach-web-58.png?v=1781174295570', author: 'Deborah Marcero' },
    { title: 'Hũ tình bạn', price: '71.200', oldPrice: '89.000', discount: '-20%', img: 'https://bizweb.dktcdn.net/thumb/large/100/363/455/products/bia-sach-web-57.png?v=1781173330663', author: 'Deborah Marcero' },
    { title: 'Phát triển EQ - Rèn nội lực vững vàng', price: '111.200', oldPrice: '139.000', discount: '-20%', img: 'https://bizweb.dktcdn.net/thumb/large/100/363/455/products/bia-sach-web-45.png?v=1781171532970', author: 'Viện nghiên cứu độc giả' }
  ];

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
      }
    });
  }

  fetchBook(id: string) {
    console.log(`[BooksDetail] fetchBook called with id: "${id}"`);
    this.loading = true;

    // Thử lấy từ /api/books trước, nếu lỗi thì thử /api/products
    this.bookService.getBookById(id).subscribe({
      next: (data) => {
        console.log(`[BooksDetail] getBookById next received:`, data);
        if (!data || Object.keys(data).length === 0) {
          // Không có data, thử /api/products
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
          this.error = 'Không tìm thấy sách này.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        // Normalize fields
        if (!data.price_current) data.price_current = data.price || 0;
        this.setBook(data);
      },
      error: (err) => {
        console.error('[BooksDetail] Lỗi khi tải thông tin sách:', err);
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
}
