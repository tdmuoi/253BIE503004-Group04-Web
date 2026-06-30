import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-thanh-li',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './thanh-li.html',
  styleUrl: './thanh-li.css',
})
export class ThanhLi {
  private readonly fb = inject(FormBuilder);

  // Form initialization
  readonly form = this.fb.group({
    // Step 1: Personal Info
    fullname: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^(0[23456789][0-9]{8,9})$/)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    
    // Step 2: Book Info
    bookTitle: ['', [Validators.required]],
    author: ['', [Validators.required]],
    category: ['Văn học', [Validators.required]],
    condition: ['Mới (Chưa sử dụng)', [Validators.required]],
    
    // Step 3: Shipping Method
    shippingMethod: ['postoffice', [Validators.required]]
  });

  // Recent liquidation requests history
  readonly recentRequests = [
    { 
      title: 'Nhà Giả Kim', 
      author: 'Paulo Coelho', 
      date: '12/10/2023', 
      status: 'approved', 
      statusLabel: 'Đã duyệt' 
    },
    { 
      title: 'Đắc Nhân Tâm', 
      author: 'Dale Carnegie', 
      date: '05/10/2023', 
      status: 'pending', 
      statusLabel: 'Đang chờ' 
    },
    { 
      title: 'Chiến Tranh Và Hòa Bình', 
      author: 'Léo Tolstoy', 
      date: '28/09/2023', 
      status: 'rejected', 
      statusLabel: 'Từ chối' 
    }
  ];

  // Selected files mockup
  readonly uploadedImageName = signal<string | null>(null);

  // Status submission tracking
  readonly submitting = signal<boolean>(false);
  readonly submissionSuccess = signal<boolean | null>(null);

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

  // Handle mock file uploads
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.uploadedImageName.set(file.name);
    }
  }

  // Add another book mockup
  addAnotherBook() {
    this.form.patchValue({
      bookTitle: '',
      author: '',
      category: 'Văn học',
      condition: 'Mới (Chưa sử dụng)'
    });
    this.uploadedImageName.set(null);
    alert('Đã lưu thông tin sách hiện tại. Bạn có thể nhập thêm thông tin cuốn sách mới!');
  }

  // Submit Request
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Vui lòng điền đầy đủ và đúng định dạng các trường thông tin bắt buộc.');
      return;
    }

    this.submitting.set(true);
    
    // Simulate API request
    setTimeout(() => {
      this.submitting.set(false);
      this.submissionSuccess.set(true);
      alert('Gửi yêu cầu thanh lý thành công! Đội ngũ Lightbooks sẽ sớm liên hệ xác thực.');
      this.form.reset({
        category: 'Văn học',
        condition: 'Mới (Chưa sử dụng)',
        shippingMethod: 'postoffice'
      });
      this.uploadedImageName.set(null);
    }, 1500);
  }
}
