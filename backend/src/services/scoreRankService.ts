import prisma from '../utils/database';

// 根据分数获取位次，或根据位次获取分数
export async function getScoreRankMapping(year: number, score?: number, rank?: number) {
  try {
    // 如果提供了分数，查询对应的位次
    if (score !== undefined) {
      // 查询该分数附近的所有记录，找到最接近的位次
      const records = await prisma.admissionData.findMany({
        where: {
          year,
          minScore: {
            not: null
          },
          minRank: {
            not: null
          }
        },
        select: {
          minScore: true,
          minRank: true
        },
        orderBy: {
          minScore: 'asc'
        }
      });

      // 将字符串转换为数字进行计算
      const validRecords = records
        .map(r => ({
          score: typeof r.minScore === 'string' ? parseInt(r.minScore) : r.minScore,
          rank: typeof r.minRank === 'string' ? parseInt(r.minRank) : r.minRank
        }))
        .filter(r => !isNaN(r.score) && !isNaN(r.rank));

      // 找到最接近该分数的记录
      const closest = validRecords.reduce((prev, curr) => {
        return Math.abs(curr.score - score) < Math.abs(prev.score - score) ? curr : prev;
      }, validRecords[0]);

      if (closest) {
        return { score: closest.score, rank: closest.rank };
      }
    }

    // 如果提供了位次，查询对应的分数
    if (rank !== undefined) {
      const records = await prisma.admissionData.findMany({
        where: {
          year,
          minScore: {
            not: null
          },
          minRank: {
            not: null
          }
        },
        select: {
          minScore: true,
          minRank: true
        },
        orderBy: {
          minRank: 'asc'
        }
      });

      // 将字符串转换为数字进行计算
      const validRecords = records
        .map(r => ({
          score: typeof r.minScore === 'string' ? parseInt(r.minScore) : r.minScore,
          rank: typeof r.minRank === 'string' ? parseInt(r.minRank) : r.minRank
        }))
        .filter(r => !isNaN(r.score) && !isNaN(r.rank));

      // 找到最接近该位次的记录
      const closest = validRecords.reduce((prev, curr) => {
        return Math.abs(curr.rank - rank) < Math.abs(prev.rank - rank) ? curr : prev;
      }, validRecords[0]);

      if (closest) {
        return { score: closest.score, rank: closest.rank };
      }
    }

    return {};
  } catch (error) {
    console.error('分数位次映射错误:', error);
    throw error;
  }
}
