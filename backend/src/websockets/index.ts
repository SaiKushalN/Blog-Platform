import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupWebSockets = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      const user = await User.findById(decoded.userId).select('username');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User ${socket.username} (${socket.userId}) connected`);

    // Join post room for live updates
    socket.on('join-post', (postId: string) => {
      socket.join(`post-${postId}`);
      console.log(`📝 User ${socket.username} joined post ${postId}`);
    });

    // Leave post room
    socket.on('leave-post', (postId: string) => {
      socket.leave(`post-${postId}`);
      console.log(`📝 User ${socket.username} left post ${postId}`);
    });

    // Handle new comment
    socket.on('new-comment', async (data: { postId: string; content: string; parentComment?: string }) => {
      try {
        const comment = new Comment({
          content: data.content,
          author: socket.userId,
          post: data.postId,
          parentComment: data.parentComment || null
        });

        await comment.save();
        await comment.populate('author', 'username avatar');

        // Emit to all users in the post room
        io.to(`post-${data.postId}`).emit('comment-added', {
          comment,
          postId: data.postId
        });

        console.log(`💬 New comment added by ${socket.username} on post ${data.postId}`);
      } catch (error) {
        socket.emit('comment-error', { error: 'Failed to add comment' });
        console.error('Comment creation error:', error);
      }
    });

    // Handle comment updates
    socket.on('update-comment', async (data: { commentId: string; content: string; postId: string }) => {
      try {
        const comment = await Comment.findByIdAndUpdate(
          data.commentId,
          { content: data.content, isEdited: true },
          { new: true }
        ).populate('author', 'username avatar');

        if (comment) {
          io.to(`post-${data.postId}`).emit('comment-updated', {
            comment,
            postId: data.postId
          });

          console.log(`✏️ Comment updated by ${socket.username} on post ${data.postId}`);
        }
      } catch (error) {
        socket.emit('comment-error', { error: 'Failed to update comment' });
        console.error('Comment update error:', error);
      }
    });

    // Handle comment deletion
    socket.on('delete-comment', async (data: { commentId: string; postId: string }) => {
      try {
        await Comment.findByIdAndDelete(data.commentId);
        
        io.to(`post-${data.postId}`).emit('comment-deleted', {
          commentId: data.commentId,
          postId: data.postId
        });

        console.log(`🗑️ Comment deleted by ${socket.username} on post ${data.postId}`);
      } catch (error) {
        socket.emit('comment-error', { error: 'Failed to delete comment' });
        console.error('Comment deletion error:', error);
      }
    });

    // Handle post likes
    socket.on('post-like', async (data: { postId: string; action: 'like' | 'unlike' }) => {
      try {
        const post = await Post.findById(data.postId);
        if (!post) return;

        if (data.action === 'like') {
          if (!post.likes.includes(socket.userId!)) {
            post.likes.push(socket.userId!);
          }
        } else {
          const index = post.likes.indexOf(socket.userId!);
          if (index > -1) {
            post.likes.splice(index, 1);
          }
        }

        await post.save();
        
        io.to(`post-${data.postId}`).emit('post-likes-updated', {
          postId: data.postId,
          likes: post.likes.length,
          action: data.action
        });

        console.log(`❤️ Post ${data.action} by ${socket.username} on post ${data.postId}`);
      } catch (error) {
        socket.emit('post-error', { error: 'Failed to update likes' });
        console.error('Post like error:', error);
      }
    });

    // Handle comment likes
    socket.on('comment-like', async (data: { commentId: string; postId: string; action: 'like' | 'unlike' }) => {
      try {
        const comment = await Comment.findById(data.commentId);
        if (!comment) return;

        if (data.action === 'like') {
          if (!comment.likes.includes(socket.userId!)) {
            comment.likes.push(socket.userId!);
          }
        } else {
          const index = comment.likes.indexOf(socket.userId!);
          if (index > -1) {
            comment.likes.splice(index, 1);
          }
        }

        await comment.save();
        
        io.to(`post-${data.postId}`).emit('comment-likes-updated', {
          commentId: data.commentId,
          postId: data.postId,
          likes: comment.likes.length,
          action: data.action
        });

        console.log(`❤️ Comment ${data.action} by ${socket.username} on comment ${data.commentId}`);
      } catch (error) {
        socket.emit('comment-error', { error: 'Failed to update comment likes' });
        console.error('Comment like error:', error);
      }
    });

    // Handle real-time typing indicators
    socket.on('typing-start', (data: { postId: string; type: 'comment' | 'reply' }) => {
      socket.to(`post-${data.postId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        type: data.type
      });
    });

    socket.on('typing-stop', (data: { postId: string }) => {
      socket.to(`post-${data.postId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        username: socket.username
      });
    });

    // Handle user presence
    socket.on('user-online', () => {
      socket.broadcast.emit('user-status', {
        userId: socket.userId,
        username: socket.username,
        status: 'online'
      });
    });

    // Handle private messaging (basic implementation)
    socket.on('private-message', async (data: { toUserId: string; message: string }) => {
      try {
        const toUser = await User.findById(data.toUserId);
        if (!toUser) {
          socket.emit('message-error', { error: 'User not found' });
          return;
        }

        // Emit to the specific user if they're online
        io.emit('private-message', {
          from: {
            userId: socket.userId,
            username: socket.username
          },
          to: {
            userId: data.toUserId,
            username: toUser.username
          },
          message: data.message,
          timestamp: new Date()
        });

        console.log(`💬 Private message from ${socket.username} to ${toUser.username}`);
      } catch (error) {
        socket.emit('message-error', { error: 'Failed to send message' });
        console.error('Private message error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.username} (${socket.userId}) disconnected`);
      
      // Notify other users about offline status
      socket.broadcast.emit('user-status', {
        userId: socket.userId,
        username: socket.username,
        status: 'offline'
      });
    });
  });

  // Global error handler
  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', err);
  });
};
