import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './Components/page-header/page-header';
import { Footer } from './shared/footer/footer';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, Footer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  protected readonly title = signal('my-app');
 
  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (!hash) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          const frag = hash.substring(1);
          if (frag) {
            setTimeout(() => {
              const el = document.getElementById(frag);
              if (el) {
                const headerOffset = 150; // Account for sticky header + add top spacing cushion
                const elementPosition = el.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }, 200);
          }
        }
      }
    });
  }

  showSiteLayout(): boolean {
    return !this.router.url.startsWith('/admin');
  }
}
