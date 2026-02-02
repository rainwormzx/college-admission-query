const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeScores() {
  console.log('=== 2025年分数分布分析 ===\n');

  // 查询2025年各分数的数量
  const scores = await prisma.admissionData.groupBy({
    by: ['minScore'],
    where: {
      year: 2025,
      minScore: { not: null }
    },
    _count: {
      minScore: true
    },
    orderBy: {
      _count: {
        minScore: 'desc'
      }
    },
    take: 20
  });

  console.log('2025年各分数段的专业数量（Top 20）:');
  scores.forEach(s => {
    console.log(`  ${s.minScore}分: ${s._count.minScore} 个专业`);
  });

  // 查询490分的详细分布
  console.log('\n=== 490分详细分析 ===');

  const score490ByBatch = await prisma.admissionData.groupBy({
    by: ['batch'],
    where: {
      year: 2025,
      minScore: 490
    },
    _count: {
      minScore: true
    }
  });

  console.log('\n490分按批次分布:');
  score490ByBatch.forEach(item => {
    console.log(`  ${item.batch}: ${item._count.minScore} 个专业`);
  });

  const score490ByCategory = await prisma.admissionData.groupBy({
    by: ['category'],
    where: {
      year: 2025,
      minScore: 490
    },
    _count: {
      minScore: true
    }
  });

  console.log('\n490分按科类分布:');
  score490ByCategory.forEach(item => {
    console.log(`  ${item.category}: ${item._count.minScore} 个专业`);
  });

  // 查询490分的部分院校示例
  const sample490 = await prisma.admissionData.findMany({
    where: {
      year: 2025,
      minScore: 490
    },
    select: {
      universityName: true,
      major: true,
      batch: true,
      category: true
    },
    take: 30
  });

  console.log('\n490分的部分院校和专业示例:');
  sample490.forEach(item => {
    console.log(`  ${item.universityName} - ${item.major} (${item.batch}, ${item.category})`);
  });

  await prisma.$disconnect();
}

analyzeScores().catch(console.error);
