import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
  resource?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireOwnership = (resourceModel: any, resourceIdField: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params[resourceIdField];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }

  next();
};
