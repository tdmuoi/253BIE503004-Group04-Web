import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about-us',
  imports: [],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  private readonly router = inject(Router);

  goToPolicy(sectionId: string) {
    void this.router.navigate(['/policy'], { fragment: sectionId });
  }
}
