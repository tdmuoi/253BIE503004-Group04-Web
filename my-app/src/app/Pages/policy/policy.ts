import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy.html',
  styleUrl: './policy.css',
})
export class Policy implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            const headerOffset = 150; // Account for sticky header + add top spacing cushion
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 150);
      }
    });
  }
}
