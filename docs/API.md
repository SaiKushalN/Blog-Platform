# Blog Platform API Documentation

## Overview

The Blog Platform API provides a comprehensive set of endpoints for managing users, posts, comments, and real-time interactions. The API is built with Node.js, Express, and MongoDB, featuring JWT authentication and WebSocket support for real-time updates.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "stack": "Error stack trace (development only)"
  }
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### GET /auth/me
Get current user information (requires authentication).

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "avatar-url",
    "bio": "User bio"
  }
}
```

#### POST /auth/refresh
Refresh the JWT token (requires authentication).

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "token": "new-jwt-token",
  "user": { ... }
}
```

### Posts

#### GET /posts
Get all published posts with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 10)
- `search` (string): Search in title, content, and tags
- `tag` (string): Filter by specific tag
- `author` (string): Filter by author ID
- `sortBy` (string): Sort field (default: 'publishedAt')
- `sortOrder` (string): Sort direction (default: 'desc')

**Response:**
```json
{
  "posts": [
    {
      "id": "post-id",
      "title": "Post Title",
      "excerpt": "Post excerpt...",
      "author": {
        "id": "author-id",
        "username": "author",
        "avatar": "avatar-url"
      },
      "tags": ["tag1", "tag2"],
      "readTime": 5,
      "views": 100,
      "likes": ["user1", "user2"],
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### GET /posts/:id
Get a single post by ID.

**Response:**
```json
{
  "post": {
    "id": "post-id",
    "title": "Post Title",
    "content": "Full post content...",
    "excerpt": "Post excerpt...",
    "author": { ... },
    "tags": ["tag1", "tag2"],
    "status": "published",
    "featuredImage": "image-url",
    "readTime": 5,
    "views": 100,
    "likes": ["user1", "user2"],
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /posts
Create a new post (requires authentication).

**Request Body:**
```json
{
  "title": "New Post Title",
  "content": "Post content...",
  "excerpt": "Post excerpt...",
  "tags": ["tag1", "tag2"],
  "status": "draft",
  "featuredImage": "image-url"
}
```

#### PUT /posts/:id
Update an existing post (requires ownership or admin role).

**Request Body:** Same as POST, but all fields are optional.

#### DELETE /posts/:id
Delete a post (requires ownership or admin role).

#### POST /posts/:id/like
Like or unlike a post (requires authentication).

**Request Body:**
```json
{
  "action": "like" // or "unlike"
}
```

#### GET /posts/tag/:tag
Get posts by specific tag.

#### GET /posts/author/:authorId
Get posts by specific author.

### Comments

#### GET /comments/post/:postId
Get comments for a specific post.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Comments per page (default: 20)

#### POST /comments
Create a new comment (requires authentication).

**Request Body:**
```json
{
  "content": "Comment content",
  "post": "post-id",
  "parentComment": "parent-comment-id" // optional, for replies
}
```

#### PUT /comments/:id
Update a comment (requires ownership).

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

#### DELETE /comments/:id
Delete a comment (requires ownership or admin role).

#### POST /comments/:id/like
Like or unlike a comment (requires authentication).

**Request Body:**
```json
{
  "action": "like" // or "unlike"
}
```

#### GET /comments/:id/replies
Get replies to a specific comment.

### Users

#### GET /users/:id
Get user profile by ID.

#### GET /users/profile/me
Get current user's profile (requires authentication).

#### PUT /users/profile/me
Update current user's profile (requires authentication).

**Request Body:**
```json
{
  "username": "newusername",
  "bio": "New bio",
  "avatar": "new-avatar-url"
}
```

#### PUT /users/profile/password
Update user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### GET /users/:id/posts
Get posts by a specific user.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 10)
- `status` (string): Post status filter (default: 'published')

### Admin Endpoints

#### GET /posts/admin/all
Get all posts including drafts (requires admin/moderator role).

#### PATCH /posts/:id/status
Update post status (requires admin/moderator role).

**Request Body:**
```json
{
  "status": "published" // or "draft", "archived"
}
```

#### GET /comments/admin/all
Get all comments for moderation (requires admin/moderator role).

#### POST /comments/:id/moderate
Moderate a comment (requires admin/moderator role).

**Request Body:**
```json
{
  "action": "approve", // or "reject", "delete", "flag"
  "reason": "Moderation reason"
}
```

#### GET /users/search/users
Search users (requires admin/moderator role).

#### PATCH /users/:id/role
Update user role (requires admin role).

**Request Body:**
```json
{
  "role": "moderator" // or "user", "admin"
}
```

#### DELETE /users/:id
Delete a user (requires admin role).

## WebSocket Events

### Connection
Connect to the WebSocket server with authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Join/Leave Post Room
```javascript
// Join a post room for real-time updates
socket.emit('join-post', 'post-id');

// Leave a post room
socket.emit('leave-post', 'post-id');
```

#### Comment Events
```javascript
// Add new comment
socket.emit('new-comment', {
  postId: 'post-id',
  content: 'Comment content',
  parentComment: 'parent-id' // optional
});

// Update comment
socket.emit('update-comment', {
  commentId: 'comment-id',
  content: 'Updated content',
  postId: 'post-id'
});

// Delete comment
socket.emit('delete-comment', {
  commentId: 'comment-id',
  postId: 'post-id'
});

// Like/unlike comment
socket.emit('comment-like', {
  commentId: 'comment-id',
  postId: 'post-id',
  action: 'like' // or 'unlike'
});
```

#### Post Events
```javascript
// Like/unlike post
socket.emit('post-like', {
  postId: 'post-id',
  action: 'like' // or 'unlike'
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing-start', {
  postId: 'post-id',
  type: 'comment' // or 'reply'
});

// Stop typing
socket.emit('typing-stop', {
  postId: 'post-id'
});
```

### Listening to Events

```javascript
// Comment events
socket.on('comment-added', (data) => {
  console.log('New comment:', data.comment);
});

socket.on('comment-updated', (data) => {
  console.log('Comment updated:', data.comment);
});

socket.on('comment-deleted', (data) => {
  console.log('Comment deleted:', data.commentId);
});

// Post events
socket.on('post-likes-updated', (data) => {
  console.log('Post likes updated:', data.likes);
});

// Typing indicators
socket.on('user-typing', (data) => {
  console.log(`${data.username} is typing...`);
});

// User status
socket.on('user-status', (data) => {
  console.log(`${data.username} is ${data.status}`);
});
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Pagination

All list endpoints support pagination with the following response format:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Search

Text search is available on posts and supports searching in:
- Title
- Content
- Tags

Search queries are case-insensitive and support partial matches.

## File Uploads

File uploads are handled through the AWS S3 integration. Supported file types:
- Images: JPEG, PNG, GIF, WebP
- Maximum file size: 5MB

## Rate Limiting Headers

Rate limiting information is included in response headers:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Development

For local development, the API runs on `http://localhost:3000` with MongoDB on `mongodb://localhost:27017/blog-platform`.

## Testing

Run the test suite:

```bash
npm test
npm run test:watch
```

## Support

For API support and questions, please refer to the project documentation or create an issue in the repository.
