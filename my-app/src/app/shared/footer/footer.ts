import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  link: string;
  fragment?: string;
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
        { label: 'Lightbook News', link: '/about-us' },
        { label: 'Cộng đồng Lightbook', link: '/about-us' },
        { label: 'Sứ mệnh - Tầm nhìn', link: '/about-us' },
      ],
    },
    {
      title: 'DANH MỤC',
      links: [
        { label: 'Sách mới', link: '/homepage' },
        { label: 'Sách cũ', link: '/sach-cu' },
        { label: 'Sách điện tử', link: '/sach-dien-tu' },
        { label: 'Thanh lý sách', link: '/thanh-li' },
      ],
    },
    {
      title: 'CHÍNH SÁCH',
      links: [
        { label: 'Bảo mật', link: '/policy', fragment: 'bao-mat' },
        { label: 'Bán hàng', link: '/policy', fragment: 'ban-hang' },
        { label: 'Thanh toán', link: '/policy', fragment: 'thanh-toan' },
        { label: 'Cẩm nang khách hàng', link: '/policy', fragment: 'cam-nang' },
      ],
    },
  ];
}
