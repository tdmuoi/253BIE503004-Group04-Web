import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Book {
  _id?: string;
  id?: string;
  url?: string;
  image?: string;
  title: string;
  author: string;
  price_current: number;
  price_old?: number;
  discount_percent?: number;
  stock?: number;
  quantity?: number;
  description?: string;
}

export interface OldBook {
  _id?: string;
  id_oldbook?: string;
  thumbnail: string;
  name: string;
  author: string;
  current_price: number;
  original_price?: number;
  flash_sale?: boolean;
  genre?: string;
  age_group?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3002/api/books';
  private readonly oldBooksApiUrl = 'http://localhost:3002/api/old-books';

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl).pipe(
      map(books => books.map(book => ({
        ...book,
        // Đảm bảo _id luôn là string (không phải ObjectId object)
        _id: typeof book._id === 'object' ? (book._id as any).$oid || String(book._id) : String(book._id || '')
      }))),
      catchError(err => {
        console.error('Lỗi khi tải danh sách sách từ API:', err);
        throw err;
      })
    );
  }

  getBookById(id: string): Observable<Book | null> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error(`Lỗi khi tải thông tin sách ${id} từ API:`, err);
        throw err;
      })
    );
  }

  getOldBooks(): Observable<OldBook[]> {
    return this.http.get<OldBook[]>(this.oldBooksApiUrl).pipe(
      map(books => books.map(book => ({
        ...book,
        _id: typeof book._id === 'object' ? (book._id as any).$oid || String(book._id) : String(book._id || '')
      }))),
      catchError(err => {
        console.error('Lỗi khi tải danh sách sách cũ từ API:', err);
        throw err;
      })
    );
  }
}
