import express from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { authenticateToken, requireRole, requireOwnership } from '../middleware/auth';
import { validatePasswordUpdate } from '../validation/auth';

const router = express.Router();

// Get user profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's published posts count
    const postsCount = await Post.countDocuments({ 
      author: user._id, 
      status: 'published' 
    });

    res.json({ 
      user: {
        ...user.toObject(),
        postsCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user's profile
router.get('/profile/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts count by status
    const [draftCount, publishedCount, archivedCount] = await Promise.all([
      Post.countDocuments({ author: user._id, status: 'draft' }),
      Post.countDocuments({ author: user._id, status: 'published' }),
      Post.countDocuments({ author: user._id, status: 'archived' })
    ]);

    res.json({ 
      user: {
        ...user.toObject(),
        stats: {
          drafts: draftCount,
          published: publishedCount,
          archived: archivedCount,
          total: draftCount + publishedCount + archivedCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update current user's profile
router.put('/profile/me', authenticateToken, async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    await user.populate('author', 'username avatar bio');

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update password
router.put('/profile/password', authenticateToken, async (req, res, next) => {
  try {
    const { error } = validatePasswordUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user's posts
router.get('/:id/posts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || 'published';
    const userId = req.params.id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const query: any = { author: userId };
    if (status !== 'all') {
      query.status = status;
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-content');

    res.json({
      posts,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio
      },
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

// Search users (admin only)
router.get('/search/users', authenticateToken, requireRole(['admin', 'moderator']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.q as string;
    const role = req.query.role as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
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

// Admin: Update user role
router.patch('/:id/role', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Admin: Delete user
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's posts and comments
    await Promise.all([
      Post.deleteMany({ author: user._id }),
      // Note: You might want to handle comments differently (e.g., anonymize them)
    ]);

    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
