import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未认证' });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'secret-key');

    next();
  } catch (error) {
    res.status(401).json({ error: '未认证' });
  }
};
