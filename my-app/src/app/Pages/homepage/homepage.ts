import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookService } from '../../Services/book.service';


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

  // ── Flash sale countdown ──
  readonly hh = signal('00');
  readonly mm = signal('00');
  readonly ss = signal('00');
  private remaining = 46 * 60 + 12; // 00:46:12
  private timer?: ReturnType<typeof setInterval>;

  // ── Search category chips ──
  readonly searchCats = ['Tiểu thuyết', 'Tâm lý', 'Kinh tế', 'Manga', 'Thiếu nhi', 'Lịch sử'];

  // ── Flash sale products ──
  flashSale: Product[] = [];

  // ── New releases ──
  newBooks: Product[] = [];

  // ── Best sellers this week ──
  readonly bestSellers = [
    { rank: '01', title: 'Con chim xanh biếc bay về', author: 'Nguyễn Nhật Ánh', price: '125.000đ', img: 'img/books/phantom.jpg' },
    { rank: '02', title: 'Nhà giả kim', author: 'Paulo Coelho', price: '89.000đ', img: 'img/books/seagull.jpg' },
    { rank: '03', title: 'Lược sử thời gian', author: 'Stephen Hawking', price: '60.000đ', img: 'img/books/dune.jpg' },
  ];

  // ── Combos ──
  readonly combos: Product[] = [
    { title: 'Trọn bộ Murakami', author: '4 cuốn ấn bản đặc biệt', img: 'img/books/cooking.jpg', price: '450.000đ' },
    { title: 'Trọn bộ Murakami', author: '4 cuốn ấn bản đặc biệt', img: 'img/books/seagull.jpg', price: '450.000đ' },
    { title: 'Trọn bộ Murakami', author: '4 cuốn ấn bản đặc biệt', img: 'img/books/dune.jpg', price: '450.000đ' },
  ];

  // ── Authors ──
  readonly authors = [
    { name: 'Nguyễn Nhật Ánh', desc: 'Vừa ra mắt ấn bản mới – Nặng nào có một chương hồn bồn lặng lười', img: 'img/books/office_preview.jpg' },
    { name: 'Phan Ý Yên', desc: 'Buổi ký tặng sách sắp về tại Phố Sách Hà Nội vào chủ nhật này', img: 'img/books/office_preview.jpg' },
    { name: 'Rosie Nguyễn', desc: 'Tặng bạn gói sự thật và cuộc đời không bạn gói ngừng dạy bàn chung tự', img: 'img/books/office_preview.jpg' },
    { name: 'Hamlet Trương', desc: 'Chuẩn bị cho dự án sách mới kết hợp cùng nhau phim nắp cộng sẽ', img: 'img/books/office_preview.jpg' },
  ];

  // ── Suggestions grid ──
  suggestions: Product[] = [];

  // ── News ──
  readonly news = [
    { tag: 'SỰ KIỆN', title: 'Ngày hội đọc sách LightBook 2026', desc: 'Khám phá hương thềm trị mở trong ngày đọc sách năm.', img: 'img/books/shelf_banner.jpg' },
    { tag: 'CẢM HỨNG', title: 'Lợi ích của việc đọc sách buổi sáng', desc: 'Vì sao đọc sách buổi sáng giúp bạn cả ngày tỉnh táo và tốt cho não bộ.', img: 'img/books/office_preview.jpg' },
    { tag: 'XU HƯỚNG', title: 'Sự trỗi dậy của thiết kế bìa sách tối giản', desc: 'Khám phá xu hướng thềm trị mở trong xuất bản hiện nay.', img: 'img/books/phantom.jpg' },
  ];

  ngOnInit(): void {
    this.render();
    this.timer = setInterval(() => {
      this.remaining = this.remaining > 0 ? this.remaining - 1 : 0;
      this.render();
    }, 1000);

    // Lấy dữ liệu sách từ backend API
    this.bookService.getBooks().subscribe({
      next: (books) => {
        const mappedProducts: Product[] = books.map(book => ({
          _id: book._id,
          title: book.title,
          author: book.author,
          img: book.image,
          price: book.price_current.toLocaleString('vi-VN') + 'đ',
          oldPrice: book.price_old ? book.price_old.toLocaleString('vi-VN') + 'đ' : undefined,
          discount: book.discount_percent ? `${book.discount_percent}%` : undefined
        }));

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
            img: book.image,
            price: book.price_current.toLocaleString('vi-VN') + 'đ',
            oldPrice: book.price_old ? book.price_old.toLocaleString('vi-VN') + 'đ' : undefined,
            discount: `${book.discount_percent}%`
          }))
          .slice(0, 4);
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
}
