import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BookService } from '../../Services/book.service';

interface Book {
  _id?: string;
  title: string;
  author: string;
  img: string;
  price: number;
  priceStr: string;
  oldPrice?: string;
  discount?: string;
  discountVal: number;
  description: string;
  category: string;
  ageRange: string;
  salesWeekly: number;
  salesMonthly: number;
  isFlashSale?: boolean;
}

@Component({
  selector: 'app-sach-dien-tu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sach-dien-tu.html',
  styleUrl: './sach-dien-tu.css',
})
export class SachDienTu implements OnInit, OnDestroy {
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);

  // Countdown Timer
  readonly dd = signal('00');
  readonly hh = signal('00');
  readonly mm = signal('00');
  private remaining = 48 * 3600 + 40 * 60 + 1; // 487:40:01 matching the reference image countdown
  private timer?: ReturnType<typeof setInterval>;

  // Filter State (Checkboxes)
  selectedPriceRanges = {
    under50: false,
    from50to100: false,
    above100: false
  };
  selectedCategories = {
    vanHoc: false,
    kinhTe: false,
    tamLyKyNang: false,
    thieuNhi: false,
    tieuSuHoiKy: false
  };
  selectedAgeRanges = {
    thieuNhi: false,
    tuoiTeen: false,
    nguoiLon: false
  };
  selectedSort = 'salesWeekly';

  // Dynamic Books Dataset loaded from MongoDB
  books: Book[] = [];
  searchQuery = '';
  isLoading = true;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // Handle search query
      const search = params['search'];
      if (search) {
        this.searchQuery = search.toLowerCase();
      } else {
        this.searchQuery = '';
      }

      // Handle category parameter
      const cat = params['category'];
      if (cat && this.selectedCategories.hasOwnProperty(cat)) {
        // Reset all categories first
        Object.keys(this.selectedCategories).forEach(k => {
          (this.selectedCategories as any)[k] = false;
        });
        // Select the one from query param
        (this.selectedCategories as any)[cat] = true;
      }
    });

    this.startTimer();
    this.loadBooks();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private loadBooks(): void {
    console.log('[SachDienTu] loadBooks started');
    this.isLoading = true;
    this.bookService.getBooks().subscribe({
      next: (data) => {
        console.log(`[SachDienTu] Received ${data?.length} books from API`);
        this.books = data.map((b) => {
          // Categorize books logically based on title keywords
          let category = 'Văn học';
          const title = (b.title || '').toLowerCase();
          if (title.includes('manifest') || title.includes('đọc vị') || title.includes('kỹ năng') || title.includes('tâm lý') || title.includes('trì hoãn') || title.includes('kỷ luật') || title.includes('phản biện') || title.includes('chữa lành') || title.includes('đũa') || title.includes('bất hạnh')) {
            category = 'Tâm lý - Kỹ năng sống';
          } else if (title.includes('kinh tế') || title.includes('đầu tư') || title.includes('nvidia') || title.includes('học máy') || title.includes('tài chính') || title.includes('quốc gia')) {
            category = 'Kinh tế';
          } else if (title.includes('eq') || title.includes('họa sĩ') || title.includes('chúc mừng sinh nhật') || title.includes('nicolas') || title.includes('totto-chan') || title.includes('miu bé nhỏ') || title.includes('cậu')) {
            category = 'Sách thiếu nhi';
          } else if (title.includes('tiểu sử') || title.includes('hồi ký') || title.includes('nhật ký') || title.includes('lịch sử') || title.includes('tính dục') || title.includes('tang lễ')) {
            category = 'Tiểu sử - Hồi ký';
          }

          // Age range mapping
          let ageRange = 'moi-lua-tuoi';
          if (category === 'Sách thiếu nhi') {
            ageRange = 'thieu-nhi';
          } else if (category === 'Tâm lý - Kỹ năng sống' || category === 'Kinh tế') {
            ageRange = 'nguoi-lon';
          } else if (category === 'Văn học') {
            ageRange = 'tuoi-teen';
          }

          const priceVal = b.price_current || (b as any).price || 0;
          const oldPriceVal = b.price_old;
          const discountVal = b.discount_percent;

          return {
            _id: b._id,
            title: b.title,
            author: b.author,
            img: b.image || b.url || '',
            price: priceVal,
            priceStr: priceVal.toLocaleString('vi-VN') + 'đ',
            oldPrice: oldPriceVal ? oldPriceVal.toLocaleString('vi-VN') + 'đ' : undefined,
            discount: discountVal ? `${discountVal}%` : undefined,
            discountVal: discountVal ? Math.abs(discountVal) : 0,
            description: b.title + ' - Một tác phẩm xuất sắc được phân phối chính thức bởi Lightbooks.',
            category: category,
            ageRange: ageRange,
            salesWeekly: Math.floor(Math.random() * 200) + 50,
            salesMonthly: Math.floor(Math.random() * 800) + 200,
            isFlashSale: discountVal ? discountVal < 0 : false
          };
        });
        this.isLoading = false;
        console.log('[SachDienTu] Mapping completed. Books mapped:', this.books.length);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[SachDienTu] Lỗi khi tải sách điện tử từ DB:', err);
      }
    });
  }

  private startTimer(): void {
    this.renderTime();
    this.timer = setInterval(() => {
      if (this.remaining > 0) {
        this.remaining--;
        this.renderTime();
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  private renderTime(): void {
    const d = Math.floor(this.remaining / (24 * 3600));
    const h = Math.floor((this.remaining % (24 * 3600)) / 3600);
    const m = Math.floor((this.remaining % 3600) / 60);
    this.dd.set(String(d).padStart(2, '0'));
    this.hh.set(String(h).padStart(2, '0'));
    this.mm.set(String(m).padStart(2, '0'));
  }

  // Flash Sale section (displays exactly 5 books in a single neat row)
  getFlashSaleBooks(): Book[] {
    return this.books.filter(b => b.isFlashSale).slice(0, 5);
  }

  // Get filtered and sorted books for Suggestions section
  getFilteredBooks(): Book[] {
    let result = [...this.books];

    // 0. Filter by Search Query
    if (this.searchQuery) {
      result = result.filter(b => 
        (b.title && b.title.toLowerCase().includes(this.searchQuery)) ||
        (b.author && b.author.toLowerCase().includes(this.searchQuery))
      );
    }

    // 1. Filter by Price Ranges (OR within price group)
    const hasPriceFilter = Object.values(this.selectedPriceRanges).some(v => v);
    if (hasPriceFilter) {
      result = result.filter(b => {
        if (this.selectedPriceRanges.under50 && b.price < 50000) return true;
        if (this.selectedPriceRanges.from50to100 && b.price >= 50000 && b.price <= 100000) return true;
        if (this.selectedPriceRanges.above100 && b.price > 100000) return true;
        return false;
      });
    }

    // 2. Filter by Category (OR within category group)
    const hasCategoryFilter = Object.values(this.selectedCategories).some(v => v);
    if (hasCategoryFilter) {
      result = result.filter(b => {
        if (this.selectedCategories.vanHoc && b.category === 'Văn học') return true;
        if (this.selectedCategories.kinhTe && b.category === 'Kinh tế') return true;
        if (this.selectedCategories.tamLyKyNang && b.category === 'Tâm lý - Kỹ năng sống') return true;
        if (this.selectedCategories.thieuNhi && b.category === 'Sách thiếu nhi') return true;
        if (this.selectedCategories.tieuSuHoiKy && b.category === 'Tiểu sử - Hồi ký') return true;
        return false;
      });
    }

    // 3. Filter by Age Ranges (OR within age group)
    const hasAgeFilter = Object.values(this.selectedAgeRanges).some(v => v);
    if (hasAgeFilter) {
      result = result.filter(b => {
        if (this.selectedAgeRanges.thieuNhi && b.ageRange === 'thieu-nhi') return true;
        if (this.selectedAgeRanges.tuoiTeen && b.ageRange === 'tuoi-teen') return true;
        if (this.selectedAgeRanges.nguoiLon && b.ageRange === 'nguoi-lon') return true;
        return false;
      });
    }

    // 4. Sort
    if (this.selectedSort === 'salesWeekly') {
      result.sort((a, b) => b.salesWeekly - a.salesWeekly);
    } else if (this.selectedSort === 'salesMonthly') {
      result.sort((a, b) => b.salesMonthly - a.salesMonthly);
    } else if (this.selectedSort === 'discount') {
      result.sort((a, b) => b.discountVal - a.discountVal);
    }

    return result;
  }

  // Reset all filters to show all products
  resetFilters(): void {
    this.selectedPriceRanges = { under50: false, from50to100: false, above100: false };
    this.selectedCategories = { vanHoc: false, kinhTe: false, tamLyKyNang: false, thieuNhi: false, tieuSuHoiKy: false };
    this.selectedAgeRanges = { thieuNhi: false, tuoiTeen: false, nguoiLon: false };
  }
}
