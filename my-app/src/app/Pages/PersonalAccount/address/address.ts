import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

interface ShippingAddress {
  id: string;
  fullname: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
  type: 'home' | 'office';
}

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address.html',
  styleUrl: './address.css'
})
export class AddressComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Address lists
  readonly addresses = signal<ShippingAddress[]>([
    {
      id: 'ADDR01',
      fullname: 'Nhất Huy',
      phone: '098 **** 217',
      city: 'Thành phố Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      detail: 'Số 15 Lê Duẩn, Tòa nhà Deutsches Haus',
      isDefault: true,
      type: 'office'
    },
    {
      id: 'ADDR02',
      fullname: 'Nguyễn Văn Huy',
      phone: '091 **** 888',
      city: 'Thành phố Hồ Chí Minh',
      district: 'Bình Thạnh',
      ward: 'Phường 25',
      detail: '456/12 Điện Biên Phủ, Hẻm 456',
      isDefault: false,
      type: 'home'
    }
  ]);

  // Form for adding/editing addresses
  readonly addressForm = this.fb.nonNullable.group({
    id: [''],
    fullname: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9* ]{10,15}$/)]],
    city: ['Thành phố Hồ Chí Minh', [Validators.required]],
    district: ['', [Validators.required]],
    ward: ['', [Validators.required]],
    detail: ['', [Validators.required]],
    type: ['home' as 'home' | 'office', [Validators.required]],
    isDefault: [false]
  });

  // UI state variables
  readonly isFormOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);

  // User details
  get user() {
    return this.authService.currentUser() || {
      username: 'Huy',
      email: 'nhathuy.ux@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user'
    };
  }

  // Sidebar navigation handler
  navigate(routePath: string) {
    void this.router.navigate([routePath]);
  }

  // Logout handler
  onLogout() {
    this.authService.logout();
  }

  // Add/edit handlers
  openAddForm() {
    this.addressForm.reset({
      id: '',
      fullname: 'Nhất Huy',
      phone: '0984812217',
      city: 'Thành phố Hồ Chí Minh',
      district: '',
      ward: '',
      detail: '',
      type: 'home',
      isDefault: false
    });
    this.isEditing.set(false);
    this.isFormOpen.set(true);
  }

  openEditForm(addr: ShippingAddress) {
    this.addressForm.setValue({
      id: addr.id,
      fullname: addr.fullname,
      phone: addr.phone,
      city: addr.city,
      district: addr.district,
      ward: addr.ward,
      detail: addr.detail,
      type: addr.type,
      isDefault: addr.isDefault
    });
    this.isEditing.set(true);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
  }

  onSubmit() {
    if (this.addressForm.invalid) {
      alert('Vui lòng điền đầy đủ và đúng định dạng các thông tin địa chỉ!');
      return;
    }

    const formVal = this.addressForm.getRawValue();
    const currentList = this.addresses();

    if (formVal.isDefault) {
      // Set all other addresses default to false
      currentList.forEach(a => a.isDefault = false);
    }

    if (this.isEditing()) {
      // Edit existing
      const updatedList = currentList.map(a => {
        if (a.id === formVal.id) {
          return {
            ...a,
            fullname: formVal.fullname,
            phone: formVal.phone,
            city: formVal.city,
            district: formVal.district,
            ward: formVal.ward,
            detail: formVal.detail,
            type: formVal.type,
            isDefault: formVal.isDefault
          };
        }
        return a;
      });
      this.addresses.set(updatedList);
      alert('Đã cập nhật địa chỉ thành công!');
    } else {
      // Create new
      const newAddr: ShippingAddress = {
        id: `ADDR0${currentList.length + 1}`,
        fullname: formVal.fullname,
        phone: formVal.phone,
        city: formVal.city,
        district: formVal.district,
        ward: formVal.ward,
        detail: formVal.detail,
        type: formVal.type,
        isDefault: currentList.length === 0 ? true : formVal.isDefault
      };
      this.addresses.set([...currentList, newAddr]);
      alert('Đã thêm địa chỉ nhận hàng mới thành công!');
    }

    this.isFormOpen.set(false);
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      const currentList = this.addresses();
      const removedItem = currentList.find(a => a.id === id);
      const updatedList = currentList.filter(a => a.id !== id);

      if (removedItem?.isDefault && updatedList.length > 0) {
        updatedList[0].isDefault = true; // Fallback default
      }

      this.addresses.set(updatedList);
      alert('Đã xóa địa chỉ thành công!');
    }
  }

  setAsDefault(id: string) {
    const updatedList = this.addresses().map(a => {
      a.isDefault = (a.id === id);
      return a;
    });
    this.addresses.set(updatedList);
    alert('Đã đổi địa chỉ mặc định thành công!');
  }
}
