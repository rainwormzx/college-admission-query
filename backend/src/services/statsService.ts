import prisma from '../utils/database';

export const getStats = async (year?: number, major?: string, schoolLocation?: string) => {
  const where: any = {};

  if (year) {
    where.year = year;
  }

  if (major) {
    where.major = {
      contains: major,
      mode: 'insensitive'
    };
  }

  if (schoolLocation) {
    where.schoolLocation = schoolLocation;
  }

  // 分数分布
  const scoreDistribution = await prisma.admissionData.groupBy({
    by: ['minScore'],
    where: {
      ...where,
      minScore: { not: null }
    },
    _count: {
      minScore: true
    },
    orderBy: {
      minScore: 'asc'
    }
  });

  // 地区统计
  const locationStats = await prisma.admissionData.groupBy({
    by: ['schoolLocation'],
    where,
    _count: {
      schoolLocation: true
    },
    orderBy: {
      _count: {
        schoolLocation: 'desc'
      }
    }
  });

  // 专业统计
  const majorStats = await prisma.admissionData.groupBy({
    by: ['major'],
    where,
    _count: {
      major: true
    },
    orderBy: {
      _count: {
        major: 'desc'
      }
    },
    take: 20
  });

  // 年份趋势
  const yearlyTrend = await prisma.admissionData.groupBy({
    by: ['year'],
    where,
    _avg: {
      minScore: true
    },
    orderBy: {
      year: 'asc'
    }
  });

  return {
    scoreDistribution: scoreDistribution.map((item) => ({
      score: item.minScore || 0,
      count: item._count.minScore
    })),
    locationStats: locationStats.map((item) => ({
      location: item.schoolLocation,
      count: item._count.schoolLocation
    })),
    majorStats: majorStats.map((item) => ({
      major: item.major,
      count: item._count.major
    })),
    yearlyTrend: yearlyTrend.map((item) => ({
      year: item.year,
      avgScore: Math.round(item._avg.minScore || 0)
    }))
  };
};
