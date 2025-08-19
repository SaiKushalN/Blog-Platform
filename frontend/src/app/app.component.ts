import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Blog Platform';
  isAuthenticated = false;
  currentUser: any = null;
  isLoading = true;
  showSidebar = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeApp();
    this.setupRouterEvents();
    this.setupAuthSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeApp(): void {
    // Check if user is already authenticated
    this.authService.checkAuthStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
            this.isAuthenticated = true;
            this.connectWebSocket();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Auth check failed:', error);
          this.isLoading = false;
        }
      });
  }

  private setupRouterEvents(): void {
    // Track page views for analytics
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        // Reset sidebar on navigation
        this.showSidebar = false;
        
        // Track page view
        if (typeof gtag !== 'undefined') {
          gtag('config', 'GA_MEASUREMENT_ID', {
            page_path: event.urlAfterRedirects
          });
        }
      });
  }

  private setupAuthSubscription(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isAuthenticated = !!user;
          
          if (user) {
            this.connectWebSocket();
          } else {
            this.disconnectWebSocket();
          }
        },
        error: (error) => {
          console.error('Auth state error:', error);
        }
      });
  }

  private connectWebSocket(): void {
    if (this.currentUser) {
      this.webSocketService.connect(this.currentUser.token);
    }
  }

  private disconnectWebSocket(): void {
    this.webSocketService.disconnect();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  onSidebarClose(): void {
    this.showSidebar = false;
  }

  // Handle global keyboard shortcuts
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd + K for search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.router.navigate(['/search']);
    }
    
    // Escape to close sidebar
    if (event.key === 'Escape' && this.showSidebar) {
      this.showSidebar = false;
    }
  }
}
