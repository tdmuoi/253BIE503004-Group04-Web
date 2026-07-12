import { Component, OnDestroy, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BookService, OldBook } from '../../Services/book.service';

interface DisplayBook {
  _id?: string;
  title: string;
  author: string;
  img: string;
  price: number;
  priceStr: string;
  oldPrice?: string;
  discount?: string;
  discountVal: number;
  genre: string;
  ageGroup: string;
  isFlashSale: boolean;
  salesWeekly: number;
  salesMonthly: number;
}

interface GenreSection {
  genre: string;
  hook: string;
}

@Component({
  selector: 'app-sach-cu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sach-cu.html',
  styleUrl: './sach-cu.css',
})
export class SachCu implements OnInit, OnDestroy {
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // FIX 1: Thêm ChangeDetectorRef để buộc Angular re-render sau khi load async
  private cdr = inject(ChangeDetectorRef);

  // Countdown Timer
  readonly dd = signal('00');
  readonly hh = signal('00');
  readonly mm = signal('00');
  private remaining = 36 * 3600 + 15 * 60 + 45;
  private timer?: ReturnType<typeof setInterval>;

  // Filter State
  selectedPriceRanges = { under50: false, from50to100: false, above100: false };
  selectedCategories = {
    vanHoc: false,
    kinhTe: false,
    tamLyKyNang: false,
    thieuNhi: false,
    tieuSuHoiKy: false,
    tonGiao: false,
    tuVi: false,
    chinhTri: false,
    ngoaiVan: false,
  };
  selectedAgeRanges = { thieuNhi: false, tuoiTeen: false, nguoiLon: false };
  selectedSort = 'salesWeekly';

  books: DisplayBook[] = [];
  isLoading = true;

  // FIX 3: State cho expand genre inline + ẩn catalog
  expandedGenre: string | null = null;
  showCatalog = true;

  // Mapping category key → genre label
  readonly categoryMap: Record<string, string> = {
    vanHoc: 'Văn học',
    kinhTe: 'Kinh tế',
    tamLyKyNang: 'Tâm lý - Kỹ năng sống',
    thieuNhi: 'Sách thiếu nhi',
    tieuSuHoiKy: 'Tiểu sử - Hồi ký',
    tonGiao: 'Tôn giáo/Tâm linh',
    tuVi: 'Tử vi/Phong thủy',
    chinhTri: 'Chính trị/Sử học',
    ngoaiVan: 'Ngoại văn',
  };

  readonly ageMap: Record<string, string> = {
    thieuNhi: 'Thiếu nhi',
    tuoiTeen: 'Tuổi teen',
    nguoiLon: 'Người lớn',
  };

  readonly genreSections: GenreSection[] = [
    { genre: 'Văn học',                hook: 'Một vé du hành đến hàng trăm thế giới.' },
    { genre: 'Kinh tế',                hook: 'Thành sói phố Wall thì chưa biết, nhưng biết cách để bớt cháy ví.' },
    { genre: 'Tâm lý - Kỹ năng sống', hook: 'Crush khó hiểu? Vào đây.' },
    { genre: 'Sách thiếu nhi',         hook: 'Người lớn cũng mê.' },
    { genre: 'Tiểu sử - Hồi ký',       hook: 'Người thật, bài học thật.' },
    { genre: 'Tôn giáo/Tâm linh',      hook: 'Yên vị sách an.' },
    { genre: 'Tử vi/Phong thủy',        hook: 'Xem vận bằng sách hót hòn họt.' },
    { genre: 'Chính trị/Sử học',        hook: 'Drama của thế kỷ trước ở đây này!.' },
    { genre: 'Ngoại văn',              hook: 'Đọc bản gốc cho đãaaa.' },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const cat = params['category'];
      if (cat && this.selectedCategories.hasOwnProperty(cat)) {
        Object.keys(this.selectedCategories).forEach(k => {
          (this.selectedCategories as any)[k] = false;
        });
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
    this.isLoading = true;
    this.bookService.getOldBooks().subscribe({
      next: (data: OldBook[]) => {
        this.books = data.map((b: OldBook) => {
          const priceVal = b.current_price || 0;
          const oldPriceVal = b.original_price;
          const discountVal = oldPriceVal && oldPriceVal > priceVal
            ? Math.round((1 - priceVal / oldPriceVal) * 100)
            : 0;

          return {
            _id: b._id,
            title: b.name || '',
            author: b.author || '',
            img: b.thumbnail || '',
            price: priceVal,
            priceStr: priceVal.toLocaleString('vi-VN') + 'đ',
            oldPrice: oldPriceVal ? oldPriceVal.toLocaleString('vi-VN') + 'đ' : undefined,
            discount: discountVal > 0 ? `-${discountVal}%` : undefined,
            discountVal: discountVal,
            genre: b.genre || 'Văn học',
            ageGroup: b.age_group || 'Người lớn',
            isFlashSale: !!b.flash_sale,
            salesWeekly: Math.floor(Math.random() * 200) + 50,
            salesMonthly: Math.floor(Math.random() * 800) + 200,
          };
        });
        this.isLoading = false;
        // FIX 1: Buộc Angular detect changes ngay sau khi data load xong
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('[SachCu] Lỗi khi tải sách cũ:', err);
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

  // ── FILTER CORE ──
  private applyFilters(list: DisplayBook[]): DisplayBook[] {
    let result = [...list];

    const hasPriceFilter = Object.values(this.selectedPriceRanges).some(v => v);
    if (hasPriceFilter) {
      result = result.filter(b => {
        if (this.selectedPriceRanges.under50 && b.price < 50000) return true;
        if (this.selectedPriceRanges.from50to100 && b.price >= 50000 && b.price <= 100000) return true;
        if (this.selectedPriceRanges.above100 && b.price > 100000) return true;
        return false;
      });
    }

    const hasCategoryFilter = Object.values(this.selectedCategories).some(v => v);
    if (hasCategoryFilter) {
      const activeGenres = Object.entries(this.selectedCategories)
        .filter(([, v]) => v)
        .map(([k]) => this.categoryMap[k]);
      result = result.filter(b => activeGenres.includes(b.genre));
    }

    const hasAgeFilter = Object.values(this.selectedAgeRanges).some(v => v);
    if (hasAgeFilter) {
      const activeAges = Object.entries(this.selectedAgeRanges)
        .filter(([, v]) => v)
        .map(([k]) => this.ageMap[k]);
      result = result.filter(b => activeAges.includes(b.ageGroup));
    }

    return result;
  }

  // Flash sale: chỉ sách có flash_sale === true
  getFlashSaleBooks(): DisplayBook[] {
    return this.applyFilters(this.books.filter(b => b.isFlashSale)).slice(0, 5);
  }

  // Top 3 genre có > 5 sách
  getTopGenreSections(): GenreSection[] {
    const counts: Record<string, number> = {};
    this.books.forEach(b => {
      counts[b.genre] = (counts[b.genre] || 0) + 1;
    });

    const eligibleGenres = Object.entries(counts)
      .filter(([, c]) => c > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    return this.genreSections.filter(s => eligibleGenres.includes(s.genre));
  }

  // Sách cho từng section:
  // - Nếu genre đang được expand → trả về tất cả
  // - Ngược lại → chỉ 5 cuốn đầu
  getBooksForGenreSection(genre: string): DisplayBook[] {
    const filtered = this.applyFilters(this.books.filter(b => b.genre === genre));
    if (this.expandedGenre === genre) {
      return filtered;
    }
    return filtered.slice(0, 5);
  }

  // Section bị ẩn nếu không còn sách sau filter
  isSectionVisible(genre: string): boolean {
    const hasCategoryFilter = Object.values(this.selectedCategories).some(v => v);
    if (hasCategoryFilter) {
      const activeGenres = Object.entries(this.selectedCategories)
        .filter(([, v]) => v)
        .map(([k]) => this.categoryMap[k]);
      if (!activeGenres.includes(genre)) return false;
    }
    return this.getBooksForGenreSection(genre).length > 0;
  }

  // FIX 3: Toggle expand genre inline + ẩn/hiện catalog
  toggleExpandGenre(genre: string): void {
    if (this.expandedGenre === genre) {
      // Đang expand → thu gọn, hiện lại catalog
      this.expandedGenre = null;
      this.showCatalog = true;
    } else {
      // Expand genre mới → ẩn catalog
      this.expandedGenre = genre;
      this.showCatalog = false;
    }
  }

  // Tuyển tập gợi ý
  getFilteredBooks(): DisplayBook[] {
    let result = this.applyFilters(this.books);

    if (this.selectedSort === 'salesWeekly') {
      result.sort((a, b) => b.salesWeekly - a.salesWeekly);
    } else if (this.selectedSort === 'salesMonthly') {
      result.sort((a, b) => b.salesMonthly - a.salesMonthly);
    } else if (this.selectedSort === 'discount') {
      result.sort((a, b) => b.discountVal - a.discountVal);
    }

    return result;
  }

  resetFilters(): void {
    this.selectedPriceRanges = { under50: false, from50to100: false, above100: false };
    this.selectedCategories = {
      vanHoc: false, kinhTe: false, tamLyKyNang: false, thieuNhi: false,
      tieuSuHoiKy: false, tonGiao: false, tuVi: false, chinhTri: false, ngoaiVan: false,
    };
    this.selectedAgeRanges = { thieuNhi: false, tuoiTeen: false, nguoiLon: false };
    // Cũng reset trạng thái expand
    this.expandedGenre = null;
    this.showCatalog = true;
    this.router.navigate(['/sach-cu']);
  }
}
