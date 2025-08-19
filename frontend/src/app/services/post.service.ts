import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Post, PostSummary, CreatePostRequest, UpdatePostRequest, PostFilters, PaginatedResponse } from '@shared/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly API_URL = environment.apiUrl;
  private postsSubject = new BehaviorSubject<PostSummary[]>([]);
  private currentPostSubject = new BehaviorSubject<Post | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private totalPostsSubject = new BehaviorSubject<number>(0);

  public readonly posts$ = this.postsSubject.asObservable();
  public readonly currentPost$ = this.currentPostSubject.asObservable();
  public readonly isLoading$ = this.isLoadingSubject.asObservable();
  public readonly totalPosts$ = this.totalPostsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get all published posts with pagination and filters
   */
  getPosts(filters: PostFilters = {}, page: number = 1, limit: number = 10): Observable<PaginatedResponse<PostSummary>> {
    this.isLoadingSubject.next(true);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Add filters
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.tags && filters.tags.length > 0) {
      params = params.set('tags', filters.tags.join(','));
    }
    if (filters.author) {
      params = params.set('author', filters.author);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<PaginatedResponse<PostSummary>>(`${this.API_URL}/posts`, { params })
      .pipe(
        tap(response => {
          this.postsSubject.next(response.data);
          this.totalPostsSubject.next(response.total);
          this.isLoadingSubject.next(false);
        })
      );
  }

  /**
   * Get a single post by ID
   */
  getPost(id: string): Observable<Post> {
    this.isLoadingSubject.next(true);
    
    return this.http.get<Post>(`${this.API_URL}/posts/${id}`)
      .pipe(
        tap(post => {
          this.currentPostSubject.next(post);
          this.isLoadingSubject.next(false);
        })
      );
  }

  /**
   * Get featured posts
   */
  getFeaturedPosts(limit: number = 6): Observable<PostSummary[]> {
    return this.http.get<PostSummary[]>(`${this.API_URL}/posts/featured?limit=${limit}`);
  }

  /**
   * Get recent posts
   */
  getRecentPosts(limit: number = 8): Observable<PostSummary[]> {
    return this.http.get<PostSummary[]>(`${this.API_URL}/posts/recent?limit=${limit}`);
  }

  /**
   * Get popular posts
   */
  getPopularPosts(limit: number = 6): Observable<PostSummary[]> {
    return this.http.get<PostSummary[]>(`${this.API_URL}/posts/popular?limit=${limit}`);
  }

  /**
   * Get posts by tag
   */
  getPostsByTag(tag: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<PostSummary>> {
    return this.http.get<PaginatedResponse<PostSummary>>(`${this.API_URL}/posts/tag/${tag}`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString())
    });
  }

  /**
   * Get posts by author
   */
  getPostsByAuthor(authorId: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<PostSummary>> {
    return this.http.get<PaginatedResponse<PostSummary>>(`${this.API_URL}/posts/author/${authorId}`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString())
    });
  }

  /**
   * Search posts
   */
  searchPosts(query: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<PostSummary>> {
    return this.http.get<PaginatedResponse<PostSummary>>(`${this.API_URL}/posts/search`, {
      params: new HttpParams()
        .set('q', query)
        .set('page', page.toString())
        .set('limit', limit.toString())
    });
  }

  /**
   * Create a new post
   */
  createPost(postData: CreatePostRequest): Observable<Post> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<Post>(`${this.API_URL}/posts`, postData, { headers })
      .pipe(
        tap(post => {
          // Add to current posts list
          const currentPosts = this.postsSubject.value;
          this.postsSubject.next([post, ...currentPosts]);
        })
      );
  }

  /**
   * Update an existing post
   */
  updatePost(id: string, postData: UpdatePostRequest): Observable<Post> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<Post>(`${this.API_URL}/posts/${id}`, postData, { headers })
      .pipe(
        tap(updatedPost => {
          // Update current post if it's the one being edited
          const currentPost = this.currentPostSubject.value;
          if (currentPost && currentPost.id === id) {
            this.currentPostSubject.next(updatedPost);
          }
          
          // Update in posts list
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.map(post => 
            post.id === id ? updatedPost : post
          );
          this.postsSubject.next(updatedPosts);
        })
      );
  }

  /**
   * Delete a post
   */
  deletePost(id: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.delete(`${this.API_URL}/posts/${id}`, { headers })
      .pipe(
        tap(() => {
          // Remove from posts list
          const currentPosts = this.postsSubject.value;
          const filteredPosts = currentPosts.filter(post => post.id !== id);
          this.postsSubject.next(filteredPosts);
          
          // Clear current post if it's the one being deleted
          const currentPost = this.currentPostSubject.value;
          if (currentPost && currentPost.id === id) {
            this.currentPostSubject.next(null);
          }
        })
      );
  }

  /**
   * Like/unlike a post
   */
  toggleLike(postId: string): Observable<{ liked: boolean; likesCount: number }> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<{ liked: boolean; likesCount: number }>(`${this.API_URL}/posts/${postId}/like`, {}, { headers })
      .pipe(
        tap(response => {
          // Update current post
          const currentPost = this.currentPostSubject.value;
          if (currentPost && currentPost.id === postId) {
            const updatedPost = { ...currentPost };
            if (response.liked) {
              updatedPost.likes.push(this.authService.currentUser!.id);
            } else {
              updatedPost.likes = updatedPost.likes.filter(id => id !== this.authService.currentUser!.id);
            }
            updatedPost.likes = updatedPost.likes.slice(0, response.likesCount);
            this.currentPostSubject.next(updatedPost);
          }
          
          // Update in posts list
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.map(post => {
            if (post.id === postId) {
              const updatedPost = { ...post };
              if (response.liked) {
                updatedPost.likes.push(this.authService.currentUser!.id);
              } else {
                updatedPost.likes = updatedPost.likes.filter(id => id !== this.authService.currentUser!.id);
              }
              updatedPost.likes = updatedPost.likes.slice(0, response.likesCount);
              return updatedPost;
            }
            return post;
          });
          this.postsSubject.next(updatedPosts);
        })
      );
  }

  /**
   * Increment post view count
   */
  incrementViews(postId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/posts/${postId}/view`, {});
  }

  /**
   * Get related posts
   */
  getRelatedPosts(postId: string, limit: number = 4): Observable<PostSummary[]> {
    return this.http.get<PostSummary[]>(`${this.API_URL}/posts/${postId}/related?limit=${limit}`);
  }

  /**
   * Get trending tags
   */
  getTrendingTags(limit: number = 20): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/posts/tags/trending?limit=${limit}`);
  }

  /**
   * Get all tags
   */
  getAllTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/posts/tags`);
  }

  /**
   * Check if user has liked a post
   */
  hasUserLiked(post: Post | PostSummary): boolean {
    if (!this.authService.isAuthenticated || !post.likes) {
      return false;
    }
    
    const userId = this.authService.currentUser?.id;
    return post.likes.includes(userId);
  }

  /**
   * Get post reading time
   */
  getReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Format post excerpt
   */
  formatExcerpt(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Clear current post
   */
  clearCurrentPost(): void {
    this.currentPostSubject.next(null);
  }

  /**
   * Refresh posts data
   */
  refreshPosts(): void {
    this.getPosts().subscribe();
  }
}
