import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/config';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    workspaceId?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    req.user = decoded;

    // If not admin, check workspace subscription
    if (decoded.role !== 'admin') {
      const [workspaces] = await pool.execute(
        `SELECT w.id, w.status, ws.end_date 
         FROM workspace_users wu
         JOIN workspaces w ON wu.workspace_id = w.id
         LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id
         WHERE wu.user_id = ? AND ws.end_date >= CURRENT_DATE()
         ORDER BY ws.end_date DESC LIMIT 1`,
        [decoded.id]
      );

      if (!workspaces || !workspaces[0]) {
        return res.status(403).json({
          message: 'No active workspace found',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      const workspace = workspaces[0];

      if (workspace.status !== 'active') {
        return res.status(403).json({
          message: 'Workspace is not active',
          code: 'WORKSPACE_INACTIVE'
        });
      }

      req.user.workspaceId = workspace.id;
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};