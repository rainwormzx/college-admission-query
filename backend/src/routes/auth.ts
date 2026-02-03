import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// 类型声明：JWT SignOptions
interface SignOptions {
  expiresIn: string | number;
}

// 兼容性修复
const signJwt = (
  payload: object,
  secret: string,
  options: SignOptions
): string => {
  return jwt.sign(payload, secret, options as any);
};

// 登录接口
router.post('/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    // 验证密码
    const accessPassword = process.env.ACCESS_PASSWORD;
    if (!accessPassword) {
      return res.status(500).json({ error: '服务器配置错误' });
    }

    if (password !== accessPassword) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成 JWT
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = signJwt({ userId: 'admin' }, secret, { expiresIn });

    res.json({
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 验证令牌接口
router.post('/verify', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');

    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

export default router;
