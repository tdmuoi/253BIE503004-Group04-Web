import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  link: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly columns: FooterColumn[] = [
    {
      title: 'VỀ CHÚNG TÔI',
      links: [
        { label: 'Lightbook News', link: '/dashboard' },
        { label: 'Cộng đồng Lightbook', link: '/dashboard' },
        { label: 'Sứ mệnh - Tầm nhìn', link: '/about-us' },
      ],
    },
    {
      title: 'DANH MỤC',
      links: [
        { label: 'Sách mới', link: '/dashboard' },
        { label: 'Sách cũ', link: '/dashboard' },
        { label: 'Sách điện tử', link: '/dashboard' },
        { label: 'Thanh lý sách', link: '/thanh-li' },
      ],
    },
    {
      title: 'CHÍNH SÁCH',
      links: [
        { label: 'Bảo mật', link: '/policy' },
        { label: 'Bán hàng', link: '/policy' },
        { label: 'Thanh toán', link: '/policy' },
        { label: 'Cẩm nang khách hàng', link: '/policy' },
      ],
    },
  ];
}
