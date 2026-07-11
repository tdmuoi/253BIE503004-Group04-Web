import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-personal-bookshelf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-bookshelf.html',
  styleUrl: './personal-bookshelf.css'
})
export class PersonalBookshelfComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  // Filter state: 'all' | 'read' | 'favorite' | 'ebook'
  readonly currentFilter = signal<'all' | 'read' | 'favorite' | 'ebook'>('all');

  // Search filter query
  readonly searchQuery = signal<string>('');

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'User',
      email: '',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Sách đang đọc (Top horizontal panel) - Mock data for now
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

  // Grid list of bookshelf books (fetched from DB)
  shelfBooks: any[] = [];

  // Modal Upload State
  showUploadModal = false;
  uploading = false;
  newBook = {
    title: '',
    author: '',
    favorite: true,
    read: false,
    ebook: false
  };
  selectedFile: File | null = null;

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('http://localhost:3002/api/personal-books', { headers }).subscribe({
      next: (data) => {
        this.shelfBooks = data || [];
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách sách cá nhân:', err);
      }
    });
  }

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

  // Add new book trigger (opens modal)
  onAddNewBook() {
    this.showUploadModal = true;
    this.newBook = { title: '', author: '', favorite: true, read: false, ebook: false };
    this.selectedFile = null;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onUploadSubmit() {
    if (!this.newBook.title || !this.newBook.author) {
      alert('Vui lòng nhập tên sách và tác giả');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.uploading = true;
    const formData = new FormData();
    formData.append('title', this.newBook.title);
    formData.append('author', this.newBook.author);
    formData.append('favorite', String(this.newBook.favorite));
    formData.append('read', String(this.newBook.read));
    formData.append('ebook', String(this.newBook.ebook));
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.post('http://localhost:3002/api/personal-books', formData, { headers }).subscribe({
      next: (res) => {
        this.uploading = false;
        this.closeUploadModal();
        this.loadBooks(); // Reload list
        alert('Tải sách lên thành công!');
      },
      error: (err) => {
        this.uploading = false;
        console.error('Lỗi khi tải sách lên:', err);
        alert('Đã xảy ra lỗi khi tải sách lên.');
      }
    });
  }

  // Read book trigger
  readBook(title: string) {
    alert(`Đang tải sách: "${title}"... Chúc bạn đọc sách vui vẻ!`);
  }
}
