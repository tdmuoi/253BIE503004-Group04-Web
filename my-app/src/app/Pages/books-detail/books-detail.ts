import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookService } from '../../Services/book.service';

@Component({
  selector: 'app-books-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './books-detail.html',
  styleUrl: './books-detail.css'
})
export class BooksDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);

  book: any = null;
  loading: boolean = true;
  error: string | null = null;
  
  quantity: number = 1;
  currentImage: string = '';

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
    this.loading = true;
    this.bookService.getBookById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.error = 'Không tìm thấy sách này.';
          this.loading = false;
          return;
        }
        this.book = data;
        // Map old properties to new ones just in case
        if (!this.book.price_current && this.book.price) {
            this.book.price_current = this.book.price;
        }
        this.currentImage = data.image || data.url || 'https://via.placeholder.com/400x500?text=No+Image';
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải thông tin sách:', err);
        this.error = 'Không thể tải thông tin sách. Vui lòng thử lại sau.';
        this.loading = false;
      }
    });
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
}
