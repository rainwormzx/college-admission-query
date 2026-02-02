import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

export default prisma;

// 优雅关闭数据库连接
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};
