import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-personal-bookshelf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-bookshelf.html',
  styleUrl: './personal-bookshelf.css'
})
export class PersonalBookshelfComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Filter state: 'all' | 'read' | 'favorite' | 'ebook'
  readonly currentFilter = signal<'all' | 'read' | 'favorite' | 'ebook'>('all');

  // Search filter query
  readonly searchQuery = signal<string>('');

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Sách đang đọc (Top horizontal panel)
  readonly readingBooks = [
    { 
      title: 'Những Kẻ Mộng Mơ', 
      author: 'Vũ Thế Thành', 
      image: '/img/books/money.jpg' 
    },
    { 
      title: 'Ngọn Hải Đăng Cuối Cùng', 
      author: 'Lê Hoàng Nam', 
      image: '/img/books/phantom.jpg' 
    }
  ];

  // Grid list of bookshelf books
  readonly shelfBooks = [
    { 
      title: 'Ký Ức Thành Phố', 
      author: 'Nguyễn Văn A', 
      image: '/img/books/seagull.jpg',
      favorite: true,
      read: true,
      ebook: false
    },
    { 
      title: 'Dưới Ánh Mặt Trời', 
      author: 'Trần Thị B', 
      image: '/img/books/cooking.jpg',
      favorite: false,
      read: true,
      ebook: true
    },
    { 
      title: 'Vụ Án Đêm Trăng', 
      author: 'Lê Văn C', 
      image: '/img/books/dune.jpg',
      favorite: true,
      read: false,
      ebook: true
    },
    { 
      title: 'Nghệ Thuật Tập...', 
      author: 'Phạm Minh D', 
      image: '/img/books/money.jpg',
      favorite: false,
      read: true,
      ebook: false
    },
    { 
      title: 'Lời Ru Của Gió', 
      author: 'Hoàng Mai E', 
      image: '/img/books/phantom.jpg',
      favorite: true,
      read: true,
      ebook: false
    },
    { 
      title: 'Thế Giới Phẳng', 
      author: 'Đỗ Hùng F', 
      image: '/img/books/dune.jpg',
      favorite: false,
      read: false,
      ebook: true
    },
    { 
      title: 'Quản Trị Chiến Lược', 
      author: 'Vũ Duy G', 
      image: '/img/books/cooking.jpg',
      favorite: false,
      read: true,
      ebook: true
    }
  ];

  // Computed filtered bookshelf list
  get filteredBooks() {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.currentFilter();
    
    return this.shelfBooks.filter(book => {
      // Apply Search Filter
      const matchSearch = book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
      
      // Apply Tag Filter
      if (filter === 'favorite') return matchSearch && book.favorite;
      if (filter === 'read') return matchSearch && book.read;
      if (filter === 'ebook') return matchSearch && book.ebook;
      return matchSearch;
    });
  }

  // Sidebar navigation handler
  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  // Logout handler
  onLogout() {
    this.authService.logout();
  }

  // Set grid filter
  setFilter(filter: 'all' | 'read' | 'favorite' | 'ebook') {
    this.currentFilter.set(filter);
  }

  // Update search query
  onSearch(event: any) {
    this.searchQuery.set(event.target.value || '');
  }

  // Add new book mockup trigger
  onAddNewBook() {
    alert('Tính năng tải lên hoặc liên kết sách mới đang được cập nhật!');
  }

  // Read book trigger
  readBook(title: string) {
    alert(`Đang tải sách: "${title}"... Chúc bạn đọc sách vui vẻ!`);
  }
}
