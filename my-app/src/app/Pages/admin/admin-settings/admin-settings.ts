import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Role {
  roleName: string;
  assignedUsers: number;
  accessLevel: string;
  status: string;
}

interface Settings {
  language: string;
  theme: string;
  vnpayConnected: boolean;
  momoConnected: boolean;
  freePreviewLimit: number;
  watermarkText: string;
  encryptionLevel: string;
  roles: Role[];
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.css'
})
export class AdminSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  settings: Settings = {
    language: 'Vietnamese',
    theme: 'light',
    vnpayConnected: true,
    momoConnected: false,
    freePreviewLimit: 10,
    watermarkText: 'Lightbooks Copy',
    encryptionLevel: 'enhanced',
    roles: []
  };

  loading = true;
  saving = false;

  // Add role form helper state
  showRoleModal = false;
  editingRoleIndex: number | null = null;
  newRole: Role = {
    roleName: '',
    assignedUsers: 0,
    accessLevel: 'Limited',
    status: 'Active'
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.http.get<Settings>('http://localhost:3002/api/admin/settings').subscribe({
      next: (res) => {
        if (res) {
          this.settings = res;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch settings from API', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveSettings() {
    this.saving = true;
    this.http.post('http://localhost:3002/api/admin/settings', this.settings).subscribe({
      next: () => {
        this.saving = false;
        alert('Lưu cài đặt thành công!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save settings', err);
        this.saving = false;
        alert('Lưu cài đặt thất bại. Vui lòng thử lại!');
        this.cdr.detectChanges();
      }
    });
  }

  toggleTheme() {
    this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
    // Applying theme styling to HTML class
    const htmlEl = document.documentElement;
    if (this.settings.theme === 'dark') {
      htmlEl.classList.add('dark-mode');
    } else {
      htmlEl.classList.remove('dark-mode');
    }
  }

  setEncryption(level: string) {
    this.settings.encryptionLevel = level;
  }

  resetDefaults() {
    if (confirm('Bạn có chắc chắn muốn đặt lại tất cả thông số cài đặt về mặc định?')) {
      this.settings = {
        language: 'Vietnamese',
        theme: 'light',
        vnpayConnected: true,
        momoConnected: false,
        freePreviewLimit: 10,
        watermarkText: 'Lightbooks Copy',
        encryptionLevel: 'enhanced',
        roles: [
          { roleName: 'Admin', assignedUsers: 3, accessLevel: 'Full Access', status: 'Active' },
          { roleName: 'Editor', assignedUsers: 8, accessLevel: 'Content Only', status: 'Active' },
          { roleName: 'Support', assignedUsers: 12, accessLevel: 'Limited', status: 'Inactive' }
        ]
      };
      this.cdr.detectChanges();
    }
  }

  // Roles CRUD helper methods
  openRoleModal(index: number | null = null) {
    if (index !== null) {
      this.editingRoleIndex = index;
      this.newRole = { ...this.settings.roles[index] };
    } else {
      this.editingRoleIndex = null;
      this.newRole = {
        roleName: '',
        assignedUsers: 0,
        accessLevel: 'Limited',
        status: 'Active'
      };
    }
    this.showRoleModal = true;
    this.cdr.detectChanges();
  }

  closeRoleModal() {
    this.showRoleModal = false;
  }

  saveRole() {
    if (!this.newRole.roleName) {
      alert('Vui lòng nhập Tên vai trò (Role Name)!');
      return;
    }

    if (this.editingRoleIndex !== null) {
      this.settings.roles[this.editingRoleIndex] = { ...this.newRole };
    } else {
      this.settings.roles.push({ ...this.newRole });
    }
    this.showRoleModal = false;
    this.cdr.detectChanges();
  }

  deleteRole(index: number) {
    if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${this.settings.roles[index].roleName}"?`)) {
      this.settings.roles.splice(index, 1);
      this.cdr.detectChanges();
    }
  }
}
