import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { User } from '@shared/types';
import { AuthService } from '@services/auth.service';
import { NotificationService } from '@services/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isAuthenticated: boolean = false;
  @Input() currentUser: User | null = null;
  
  @Output() logout = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  isScrolled = false;
  isSearchOpen = false;
  searchQuery = '';
  currentRoute = '';
  unreadNotifications = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.setupRouteTracking();
    this.setupScrollTracking();
    this.setupNotificationTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Track current route for navigation highlighting
   */
  private setupRouteTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  /**
   * Track scroll position for header styling
   */
  private setupScrollTracking(): void {
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 10;
    });
  }

  /**
   * Track unread notifications
   */
  private setupNotificationTracking(): void {
    if (this.isAuthenticated) {
      this.notificationService.getUnreadCount()
        .pipe(takeUntil(this.destroy$))
        .subscribe(count => {
          this.unreadNotifications = count;
        });
    }
  }

  /**
   * Handle logout
   */
  onLogout(): void {
    this.logout.emit();
  }

  /**
   * Toggle sidebar
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Open search
   */
  openSearch(): void {
    this.isSearchOpen = true;
    setTimeout(() => {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }

  /**
   * Close search
   */
  closeSearch(): void {
    this.isSearchOpen = false;
    this.searchQuery = '';
  }

  /**
   * Handle search submission
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { 
        queryParams: { q: this.searchQuery.trim() } 
      });
      this.closeSearch();
    }
  }

  /**
   * Handle search input keydown
   */
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    } else if (event.key === 'Escape') {
      this.closeSearch();
    }
  }

  /**
   * Navigate to profile
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigate to admin dashboard
   */
  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Navigate to create post
   */
  createPost(): void {
    this.router.navigate(['/posts/new']);
  }

  /**
   * Check if route is active
   */
  isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    if (!this.currentUser) return '';
    
    const { username } = this.currentUser;
    if (username.length <= 2) return username.toUpperCase();
    
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    return this.currentUser.username || 'User';
  }

  /**
   * Check if user can access admin
   */
  canAccessAdmin(): boolean {
    return this.authService.can('access_admin');
  }

  /**
   * Check if user can create posts
   */
  canCreatePost(): boolean {
    return this.authService.can('create_post');
  }
}
