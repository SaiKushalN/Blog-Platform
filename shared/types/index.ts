// User related types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends Omit<User, 'email' | 'isVerified'> {
  postsCount: number;
  stats?: {
    drafts: number;
    published: number;
    archived: number;
    total: number;
  };
}

// Post related types
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: User;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  readTime: number;
  views: number;
  likes: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummary extends Omit<Post, 'content'> {
  // Excludes content for list views
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: 'draft' | 'published';
  featuredImage?: string;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  // All fields are optional for updates
}

// Comment related types
export interface Comment {
  id: string;
  content: string;
  author: User;
  post: string;
  parentComment?: string;
  likes: string[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  post: string;
  parentComment?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Authentication types
export interface AuthRequest {
  username?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  username: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// WebSocket event types
export interface WebSocketEvents {
  // Post events
  'post-likes-updated': {
    postId: string;
    likes: number;
    action: 'like' | 'unlike';
  };
  
  // Comment events
  'comment-added': {
    comment: Comment;
    postId: string;
  };
  'comment-updated': {
    comment: Comment;
    postId: string;
  };
  'comment-deleted': {
    commentId: string;
    postId: string;
  };
  'comment-likes-updated': {
    commentId: string;
    postId: string;
    likes: number;
    action: 'like' | 'unlike';
  };
  
  // User events
  'user-typing': {
    userId: string;
    username: string;
    type: 'comment' | 'reply';
  };
  'user-stopped-typing': {
    userId: string;
    username: string;
  };
  'user-status': {
    userId: string;
    username: string;
    status: 'online' | 'offline';
  };
  
  // Private messaging
  'private-message': {
    from: { userId: string; username: string };
    to: { userId: string; username: string };
    message: string;
    timestamp: Date;
  };
  
  // Error events
  'comment-error': { error: string };
  'post-error': { error: string };
  'message-error': { error: string };
}

// Search and filter types
export interface PostFilters {
  search?: string;
  tag?: string;
  author?: string;
  status?: 'draft' | 'published' | 'archived';
  sortBy?: 'title' | 'createdAt' | 'publishedAt' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters {
  search?: string;
  role?: 'user' | 'moderator' | 'admin';
}

// File upload types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  usersByRole: Record<string, number>;
  postsByStatus: Record<string, number>;
  recentActivity: Array<{
    type: 'user_registered' | 'post_created' | 'comment_added';
    data: any;
    timestamp: string;
  }>;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'like' | 'mention' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
