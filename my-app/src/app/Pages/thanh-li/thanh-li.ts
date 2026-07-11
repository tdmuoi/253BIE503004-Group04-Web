import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-thanh-li',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './thanh-li.html',
  styleUrl: './thanh-li.css',
})
export class ThanhLi implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Form initialization
  readonly form = this.fb.group({
    // Step 1: Personal Info
    fullname: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^(0[23456789][0-9]{8,9})$/)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    
    // Step 2: Book Info (no required - handled via addedBooks array)
    bookTitle: [''],
    author: [''],
    category: ['Văn học'],
    condition: ['Mới (Chưa sử dụng)'],
    
    // Step 3: Shipping Method
    shippingMethod: ['postoffice', [Validators.required]]
  });

  // Recent liquidation requests history
  recentRequests: any[] = [];

  // Books currently added
  addedBooks: any[] = [];

  // Selected files mockup
  readonly uploadedImageName = signal<string | null>(null);
  selectedImageBase64: string | null = null;

  // Status submission tracking
  readonly submitting = signal<boolean>(false);
  readonly submissionSuccess = signal<boolean | null>(null);

  ngOnInit() {
    this.prefillUserInfo();
    this.loadHistory();
  }

  prefillUserInfo() {
    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({
        fullname: (user as any).name || user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }

  loadHistory() {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('http://localhost:3002/api/liquidations/my-requests', { headers }).subscribe({
      next: (data) => {
        console.log('Dữ liệu lịch sử nhận được:', data);
        this.recentRequests = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi khi lấy lịch sử thanh lý:', err)
    });
  }

  // Getters for Step 1
  get fullnameControl() { return this.form.controls.fullname; }
  get phoneControl() { return this.form.controls.phone; }
  get emailControl() { return this.form.controls.email; }
  get addressControl() { return this.form.controls.address; }

  // Getters for Step 2
  get bookTitleControl() { return this.form.controls.bookTitle; }
  get authorControl() { return this.form.controls.author; }
  get categoryControl() { return this.form.controls.category; }
  get conditionControl() { return this.form.controls.condition; }

  // Getters for Step 3
  get shippingMethodControl() { return this.form.controls.shippingMethod; }

  // Choose shipping method
  setShippingMethod(method: 'postoffice' | 'self') {
    this.form.patchValue({ shippingMethod: method });
  }

  // Handle file uploads
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.uploadedImageName.set(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Add another book
  addAnotherBook() {
    if (!this.bookTitleControl.value || !this.authorControl.value) {
      alert('Vui lòng điền tên sách và tác giả trước khi thêm sách khác.');
      return;
    }

    this.addedBooks.push({
      title: this.bookTitleControl.value,
      author: this.authorControl.value,
      category: this.categoryControl.value,
      condition: this.conditionControl.value,
      image: this.selectedImageBase64
    });

    this.form.patchValue({
      bookTitle: '',
      author: '',
      category: 'Văn học',
      condition: 'Mới (Chưa sử dụng)'
    });
    this.uploadedImageName.set(null);
    this.selectedImageBase64 = null;
    alert('Đã thêm sách vào danh sách chờ!');
  }

  // Submit Request - Y HỆT PATTERN CỦA ORDER: gửi JSON thuần
  onSubmit() {
    // If the user has typed something in the current form, auto-add it.
    if (this.bookTitleControl.value && this.authorControl.value) {
      this.addedBooks.push({
        title: this.bookTitleControl.value,
        author: this.authorControl.value,
        category: this.categoryControl.value,
        condition: this.conditionControl.value,
        image: this.selectedImageBase64
      });
      this.form.patchValue({ bookTitle: '', author: '' });
      this.uploadedImageName.set(null);
      this.selectedImageBase64 = null;
    }

    if (this.addedBooks.length === 0) {
      alert('Vui lòng nhập thông tin ít nhất một cuốn sách.');
      return;
    }

    // Only validate contact fields
    const contactInvalid = this.fullnameControl.invalid || this.phoneControl.invalid ||
      this.emailControl.invalid || this.addressControl.invalid;
    if (contactInvalid) {
      this.form.markAllAsTouched();
      alert('Vui lòng điền đầy đủ và đúng định dạng các trường thông tin liên hệ bắt buộc.');
      return;
    }

    this.submitting.set(true);

    // Lấy user_id y hệt cách order làm
    const user = this.authService.currentUser();
    const userId = user ? ((user as any).id || (user as any)._id || null) : null;

    // Gửi JSON thuần y hệt order
    const liquidationData = {
      user_id: userId,
      fullname: this.fullnameControl.value,
      phone: this.phoneControl.value,
      email: this.emailControl.value,
      address: this.addressControl.value,
      shippingMethod: this.shippingMethodControl.value,
      books: this.addedBooks
    };

    console.log('Gửi yêu cầu thanh lý:', liquidationData);

    this.http.post('http://localhost:3002/api/liquidations', liquidationData).subscribe({
      next: (res: any) => {
        console.log('Thanh lý thành công:', res);
        this.submitting.set(false);
        this.submissionSuccess.set(true);
        alert('Gửi yêu cầu thanh lý thành công! Đội ngũ Lightbooks sẽ sớm liên hệ xác thực.');
        
        // Reset
        this.addedBooks = [];
        this.form.reset({
          category: 'Văn học',
          condition: 'Mới (Chưa sử dụng)',
          shippingMethod: 'postoffice'
        });
        this.prefillUserInfo();
        this.loadHistory();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Lỗi khi gửi yêu cầu:', err);
        alert('Đã xảy ra lỗi khi gửi yêu cầu: ' + (err.error?.error || err.message));
      }
    });
  }

  // Chức năng xem chi tiết yêu cầu thanh lý
  showDetailsModal = false;
  selectedLiquidation: any = null;

  viewDetails(reqId: string) {
    const token = this.authService.getAccessToken();
    if (!token) {
      alert('Vui lòng đăng nhập để xem chi tiết.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>(`http://localhost:3002/api/liquidations/${reqId}`, { headers }).subscribe({
      next: (data) => {
        this.selectedLiquidation = data;
        this.showDetailsModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết thanh lý:', err);
        alert('Không thể tải chi tiết yêu cầu thanh lý này.');
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedLiquidation = null;
    this.cdr.detectChanges();
  }
}
