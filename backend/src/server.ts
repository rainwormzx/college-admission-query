import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admissionRouter from './routes/admission';
import aiRouter from './routes/ai';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
// 认证路由（不需要认证中间件）
app.use('/api/auth', authRouter);

// 受保护的路由（需要认证）
app.use('/api/admission', authMiddleware, admissionRouter);
app.use('/api/ai', authMiddleware, aiRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 API文档: http://localhost:${PORT}/health`);
});
