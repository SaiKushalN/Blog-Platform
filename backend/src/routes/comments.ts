import express from 'express';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { authenticateToken, requireRole, requireOwnership, optionalAuth } from '../middleware/auth';
import { validateComment, validateCommentUpdate, validateCommentModeration } from '../validation/comments';

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const postId = req.params.postId;

    // Verify post exists and is published
    const post = await Post.findById(postId);
    if (!post || post.status !== 'published') {
      return res.status(404).json({ error: 'Post not found' });
    }

    const query = { post: postId };
    const total = await Comment.countDocuments(query);

    const comments = await Comment.find(query)
      .populate('author', 'username avatar')
      .populate({
        path: 'parentComment',
        populate: {
          path: 'author',
          select: 'username avatar'
        }
      })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new comment
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error } = validateComment(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { content, post: postId, parentComment } = req.body;

    // Verify post exists and is published
    const post = await Post.findById(postId);
    if (!post || post.status !== 'published') {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If this is a reply, verify parent comment exists
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentComment || null
    });

    await comment.save();
    await comment.populate('author', 'username avatar');

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

// Update comment (author only)
router.put('/:id', authenticateToken, requireOwnership(Comment), async (req, res, next) => {
  try {
    const { error } = validateCommentUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const comment = req.resource;
    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({ comment });
  } catch (error) {
    next(error);
  }
});

// Delete comment (author or admin only)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user can delete this comment
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await comment.remove();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Like/unlike comment
router.post('/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.json({ likes: comment.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    next(error);
  }
});

// Get comment replies
router.get('/:id/replies', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const commentId = req.params.id;

    const query = { parentComment: commentId };
    const total = await Comment.countDocuments(query);

    const replies = await Comment.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      replies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all comments for moderation
router.get('/admin/all', authenticateToken, requireRole(['admin', 'moderator']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const postId = req.query.post as string;
    const authorId = req.query.author as string;

    const query: any = {};
    if (postId) query.post = postId;
    if (authorId) query.author = authorId;

    const total = await Comment.countDocuments(query);
    const comments = await Comment.find(query)
      .populate('author', 'username avatar')
      .populate('post', 'title')
      .populate('parentComment', 'content')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Moderate comment
router.post('/:id/moderate', authenticateToken, requireRole(['admin', 'moderator']), async (req, res, next) => {
  try {
    const { error } = validateCommentModeration(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { action, reason } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    switch (action) {
      case 'approve':
        // Comment is already approved by default
        break;
      case 'reject':
        comment.content = '[Comment rejected by moderator]';
        break;
      case 'delete':
        await comment.remove();
        return res.json({ message: 'Comment deleted successfully' });
      case 'flag':
        // Add flag for review
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({ comment, action, reason });
  } catch (error) {
    next(error);
  }
});

export default router;
