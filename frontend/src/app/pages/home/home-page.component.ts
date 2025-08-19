import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Post, PostSummary } from '@shared/types';
import { PostService } from '@services/post.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy {
  featuredPosts: PostSummary[] = [];
  recentPosts: PostSummary[] = [];
  popularPosts: PostSummary[] = [];
  isLoading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all home page data
   */
  private loadHomeData(): void {
    this.isLoading = true;
    this.error = null;

    // Load featured posts
    this.postService.getFeaturedPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this.featuredPosts = posts;
        },
        error: (error) => {
          console.error('Error loading featured posts:', error);
          this.error = 'Failed to load featured posts';
        }
      });

    // Load recent posts
    this.postService.getRecentPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this.recentPosts = posts;
        },
        error: (error) => {
          console.error('Error loading recent posts:', error);
          this.error = 'Failed to load recent posts';
        }
      });

    // Load popular posts
    this.postService.getPopularPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this.popularPosts = posts;
        },
        error: (error) => {
          console.error('Error loading popular posts:', error);
          this.error = 'Failed to load popular posts';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  /**
   * Navigate to post detail
   */
  onPostClick(post: PostSummary): void {
    this.router.navigate(['/posts', post.id]);
  }

  /**
   * Navigate to create new post
   */
  onCreatePost(): void {
    this.router.navigate(['/posts/new']);
  }

  /**
   * Navigate to all posts
   */
  onViewAllPosts(): void {
    this.router.navigate(['/posts']);
  }

  /**
   * Check if user can create posts
   */
  get canCreatePost(): boolean {
    return this.authService.can('create_post');
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  /**
   * Get welcome message
   */
  get welcomeMessage(): string {
    if (this.isAuthenticated) {
      const user = this.authService.currentUser;
      return `Welcome back, ${user?.username || 'User'}!`;
    }
    return 'Welcome to Blog Platform';
  }

  /**
   * Get subtitle message
   */
  get subtitleMessage(): string {
    if (this.isAuthenticated) {
      return 'Discover amazing content or share your own stories.';
    }
    return 'Discover amazing content from writers around the world. Join our community to start sharing your own stories.';
  }

  /**
   * Retry loading data
   */
  retry(): void {
    this.loadHomeData();
  }
}
