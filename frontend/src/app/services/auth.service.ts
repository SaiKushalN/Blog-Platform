import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '@environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'blog_auth_token';
  private readonly USER_KEY = 'blog_user_data';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly token$ = this.tokenSubject.asObservable();
  public readonly authState$ = this.currentUserSubject.asObservable();
  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user data from localStorage
   */
  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store token in localStorage
   */
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Store user data in localStorage
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Check if token expires within the next 5 minutes
      return currentTime >= (expiryTime - (5 * 60 * 1000));
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Get current user
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current token
   */
  get token(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if user has admin role
   */
  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Check if user has moderator role
   */
  get isModerator(): boolean {
    return this.currentUser?.role === 'moderator' || this.currentUser?.role === 'admin';
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.handleSuccessfulAuth(response);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          this.handleSuccessfulAuth(response);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear stored data
    this.clearStoredAuth();
    
    // Update subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Navigate to home
    this.router.navigate(['/']);
    
    // Optional: Call logout endpoint
    this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe();
  }

  /**
   * Check authentication status
   */
  checkAuthStatus(): Observable<User | null> {
    const token = this.getStoredToken();
    
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return new Observable(subscriber => subscriber.next(null));
    }

    return this.http.get<{ user: User }>(`${this.API_URL}/auth/me`)
      .pipe(
        map(response => response.user),
        tap(user => {
          if (user) {
            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(error => {
          console.error('Auth status check failed:', error);
          this.logout();
          return new Observable(subscriber => subscriber.next(null));
        })
      );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, {})
      .pipe(
        tap(response => {
          this.handleSuccessfulAuth(response);
        }),
        catchError(error => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<{ user: User }>(`${this.API_URL}/users/profile/me`, profileData)
      .pipe(
        map(response => response.user),
        tap(user => {
          this.currentUserSubject.next(user);
          this.storeUser(user);
        }),
        catchError(error => {
          console.error('Profile update failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Change user password
   */
  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.API_URL}/users/profile/password`, passwordData)
      .pipe(
        catchError(error => {
          console.error('Password change failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get HTTP headers with authentication token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /**
   * Handle successful authentication
   */
  private handleSuccessfulAuth(response: AuthResponse): void {
    const { token, user } = response;
    
    // Store data
    this.storeToken(token);
    this.storeUser(user);
    
    // Update subjects
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Auto-refresh token if needed
   */
  autoRefreshToken(): void {
    const token = this.token;
    
    if (token && this.isTokenExpired(token)) {
      this.refreshToken().subscribe({
        next: () => {
          console.log('Token refreshed successfully');
        },
        error: (error) => {
          console.error('Auto token refresh failed:', error);
          this.logout();
        }
      });
    }
  }

  /**
   * Check if user can perform action
   */
  can(action: string, resource?: any): boolean {
    if (!this.isAuthenticated) {
      return false;
    }

    const user = this.currentUser;
    if (!user) {
      return false;
    }

    switch (action) {
      case 'create_post':
        return true; // All authenticated users can create posts
      
      case 'edit_post':
        if (!resource) return false;
        return user.id === resource.author || user.role === 'admin';
      
      case 'delete_post':
        if (!resource) return false;
        return user.id === resource.author || user.role === 'admin';
      
      case 'moderate_comments':
        return user.role === 'moderator' || user.role === 'admin';
      
      case 'manage_users':
        return user.role === 'admin';
      
      case 'access_admin':
        return user.role === 'admin';
      
      default:
        return false;
    }
  }

  /**
   * Get user permissions
   */
  getUserPermissions(): string[] {
    if (!this.isAuthenticated) {
      return [];
    }

    const permissions: string[] = ['read_posts', 'create_posts'];
    const user = this.currentUser;

    if (user?.role === 'moderator') {
      permissions.push('moderate_comments', 'moderate_posts');
    }

    if (user?.role === 'admin') {
      permissions.push('moderate_comments', 'moderate_posts', 'manage_users', 'access_admin');
    }

    return permissions;
  }
}
