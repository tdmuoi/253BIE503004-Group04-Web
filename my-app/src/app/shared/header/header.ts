import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  link: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly navItems: NavItem[] = [
    { label: 'SÁCH MỚI', link: '/dashboard' },
    { label: 'SÁCH ĐIỆN TỬ', link: '/dashboard' },
    { label: 'SÁCH CŨ', link: '/dashboard' },
    { label: 'FLASH SALES', link: '/dashboard' },
    { label: 'GÓC TÁC GIẢ', link: '/dashboard' },
    { label: 'VỀ CHÚNG TÔI', link: '/about-us' },
    { label: 'LIGHTBOOK NEWS', link: '/dashboard' },
    { label: 'THANH LÝ SÁCH', link: '/thanh-li' },
  ];
}
