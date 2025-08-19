import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  
  // Footer links
  footerLinks = {
    platform: [
      { label: 'About Us', route: '/about' },
      { label: 'Contact', route: '/contact' },
      { label: 'Privacy Policy', route: '/privacy' },
      { label: 'Terms of Service', route: '/terms' }
    ],
    resources: [
      { label: 'Help Center', route: '/help' },
      { label: 'API Documentation', route: '/api-docs' },
      { label: 'Developer Guide', route: '/dev-guide' },
      { label: 'Community Guidelines', route: '/guidelines' }
    ],
    social: [
      { label: 'Twitter', icon: 'twitter', url: 'https://twitter.com/blogplatform' },
      { label: 'Facebook', icon: 'facebook', url: 'https://facebook.com/blogplatform' },
      { label: 'LinkedIn', icon: 'linkedin', url: 'https://linkedin.com/company/blogplatform' },
      { label: 'GitHub', icon: 'github', url: 'https://github.com/blogplatform' }
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {}

  /**
   * Navigate to route
   */
  navigateTo(route: string): void {
    if (route.startsWith('http')) {
      window.open(route, '_blank');
    } else {
      this.router.navigate([route]);
    }
  }

  /**
   * Get current year
   */
  getCurrentYear(): number {
    return this.currentYear;
  }
}
