import express from 'express';
import { Post } from '../models/Post';
import { authenticateToken, requireRole, requireOwnership, optionalAuth } from '../middleware/auth';
import { validatePost, validatePostUpdate } from '../validation/posts';

const router = express.Router();

// Get all published posts with pagination and search
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tag = req.query.tag as string;
    const author = req.query.author as string;
    const sortBy = req.query.sortBy as string || 'publishedAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const query: any = { status: 'published' };

    if (search) {
      query.$text = { $search: search };
    }

    if (tag) {
      query.tags = tag;
    }

    if (author) {
      query.author = author;
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-content');

    res.json({
      posts,
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

// Get single post by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username avatar'
        }
      });

    if (!post || post.status !== 'published') {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count (only for non-authors)
    if (!req.user || req.user._id.toString() !== post.author._id.toString()) {
      post.views += 1;
      await post.save();
    }

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

// Create new post (authenticated users only)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error } = validatePost(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const post = new Post({
      ...req.body,
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'username avatar bio');

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

// Update post (author or admin only)
router.put('/:id', authenticateToken, requireOwnership(Post), async (req, res, next) => {
  try {
    const { error } = validatePostUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const post = req.resource;
    Object.assign(post, req.body);
    await post.save();
    await post.populate('author', 'username avatar bio');

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

// Delete post (author or admin only)
router.delete('/:id', authenticateToken, requireOwnership(Post), async (req, res, next) => {
  try {
    await req.resource.remove();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Like/unlike post
router.post('/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ likes: post.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    next(error);
  }
});

// Get posts by tag
router.get('/tag/:tag', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tag = req.params.tag.toLowerCase();

    const query = { 
      status: 'published',
      tags: tag
    };

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-content');

    res.json({
      posts,
      tag,
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

// Get posts by author
router.get('/author/:authorId', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const authorId = req.params.authorId;

    const query = { 
      status: 'published',
      author: authorId
    };

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-content');

    res.json({
      posts,
      authorId,
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

// Admin: Get all posts (including drafts)
router.get('/admin/all', authenticateToken, requireRole(['admin', 'moderator']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const author = req.query.author as string;

    const query: any = {};
    if (status) query.status = status;
    if (author) query.author = author;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      posts,
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

// Admin: Update post status
router.patch('/:id/status', authenticateToken, requireRole(['admin', 'moderator']), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('author', 'username avatar bio');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

export default router;
