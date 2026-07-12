import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Product {
  id: string;
  title: string;
  author: string;
  image: string;
  price: number;
  price_old: number;
  discount_percent: number;
  isbn: string;
  category: string;
  stock: number;
  status: string;
}

interface ProductResponse {
  summary: {
    totalTitles: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css'
})
export class AdminProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  data: ProductResponse | null = null;
  loading = true;

  searchQuery = '';
  categoryFilter = 'All';
  statusFilter = 'All';
  currentPage = 1;

  // Categories list matches generators & standard genres
  categoriesList = ['Kinh tế & Đầu tư', 'Kỹ năng sống', 'Văn học', 'Thiếu nhi', 'Lịch sử', 'Khoa học'];

  // Edit / Add Modal State
  showModal = false;
  isEditMode = false;
  modalProduct: any = {
    id: '',
    title: '',
    author: '',
    price: 0,
    isbn: '',
    category: 'Kinh tế & Đầu tư',
    stock: 0,
    image: ''
  };

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    let url = `http://localhost:3002/api/admin/products?page=${this.currentPage}&limit=10`;
    if (this.categoryFilter !== 'All') {
      url += `&category=${encodeURIComponent(this.categoryFilter)}`;
    }
    if (this.statusFilter !== 'All') {
      url += `&status=${encodeURIComponent(this.statusFilter)}`;
    }
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }

    this.http.get<ProductResponse>(url).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products list', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProducts();
  }

  setCategoryFilter(cat: string) {
    this.categoryFilter = cat;
    this.currentPage = 1;
    this.loadProducts();
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadProducts();
  }

  changePage(page: number) {
    if (page >= 1 && page <= (this.data?.totalPages || 1)) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  getPagesArray(): number[] {
    if (!this.data) return [];
    return Array.from({ length: this.data.totalPages }, (_, i) => i + 1);
  }

  // Modal Actions
  openAddModal() {
    this.isEditMode = false;
    this.modalProduct = {
      id: '',
      title: '',
      author: '',
      price: 0,
      isbn: '',
      category: 'Kinh tế & Đầu tư',
      stock: 0,
      image: ''
    };
    this.showModal = true;
  }

  openEditModal(p: Product) {
    this.isEditMode = true;
    this.modalProduct = {
      id: p.id,
      title: p.title,
      author: p.author,
      price: p.price,
      isbn: p.isbn,
      category: p.category,
      stock: p.stock,
      image: p.image
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveProduct() {
    if (!this.modalProduct.title || !this.modalProduct.author) {
      alert('Vui lòng nhập đầy đủ Tên sách và Tác giả');
      return;
    }

    if (this.isEditMode) {
      // Edit Product
      this.http.put(`http://localhost:3002/api/admin/products/${this.modalProduct.id}`, this.modalProduct).subscribe({
        next: () => {
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to update product', err);
          alert('Cập nhật sản phẩm thất bại');
        }
      });
    } else {
      // Add Product
      this.http.post('http://localhost:3002/api/admin/products', this.modalProduct).subscribe({
        next: () => {
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to add product', err);
          alert('Thêm sản phẩm thất bại');
        }
      });
    }
  }

  deleteProduct(p: Product) {
    if (confirm(`Bạn có chắc chắn muốn xóa sách "${p.title}" không?`)) {
      this.http.delete(`http://localhost:3002/api/admin/products/${p.id}`).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to delete product', err);
          alert('Xóa sản phẩm thất bại');
        }
      });
    }
  }
}
