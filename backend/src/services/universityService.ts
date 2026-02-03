import prisma from '../utils/database';

export interface UniversityDetail {
  basicInfo: {
    name: string;
    code: string;
    location: string;
    nature: string;
    is985: boolean;
    is211: boolean;
  };
  stats: {
    majorCount: number;
    admissionDataCount: number;
    years: number[];
  };
  majors: Array<{
    name: string;
    code: string;
    minScore?: number;
    minRank?: number;
    category: string;
    batch: string;
  }>;
  scoreTrends: Array<{
    year: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
  }>;
  admissionData: Array<{
    year: number;
    major: string;
    minScore?: number;
    minRank?: number;
    category: string;
    batch: string;
  }>;
}

export async function getUniversityByName(name: string): Promise<UniversityDetail | null> {
  // 查询基础信息
  const basicInfoData = await prisma.admissionData.findFirst({
    where: { universityName: name },
    select: {
      universityName: true,
      universityCode: true,
      schoolLocation: true,
      schoolNature: true,
      is985: true,
      is211: true
    }
  });

  if (!basicInfoData) {
    return null;
  }

  // 查询统计数据
  const majors = await prisma.admissionData.findMany({
    where: { universityName: name },
    select: {
      major: true,
      majorCode: true,
      minScore: true,
      minRank: true,
      category: true,
      batch: true,
      year: true
    },
    distinct: ['major', 'year'],
    orderBy: [{ year: 'desc' }, { major: 'asc' }]
  });

  // 计算年份范围
  const yearsData = await prisma.admissionData.findMany({
    where: { universityName: name },
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  });

  // 分数趋势
  const scoreTrendsData = await prisma.$queryRaw`
    SELECT
      year,
      AVG(min_score) as avg_score,
      MIN(min_score) as min_score,
      MAX(min_score) as max_score
    FROM admission_data
    WHERE university_name = ${name}
      AND min_score IS NOT NULL
    GROUP BY year
    ORDER BY year DESC
  ` as Array<{ year: number; avg_score: number; min_score: number; max_score: number }>;

  // 最新录取数据
  const latestYear = yearsData[0]?.year || 2025;
  const admissionDataData = await prisma.admissionData.findMany({
    where: {
      universityName: name,
      year: latestYear
    },
    select: {
      year: true,
      major: true,
      minScore: true,
      minRank: true,
      category: true,
      batch: true
    },
    orderBy: [{ minScore: 'desc' }, { major: 'asc' }],
    take: 100
  });

  // 提取唯一专业（最近年份）
  const uniqueMajors = Array.from(
    new Map(
      majors
        .filter(m => m.year === latestYear)
        .map(m => [m.major, m])
    ).values()
  );

  return {
    basicInfo: {
      name: basicInfoData.universityName,
      code: basicInfoData.universityCode || '-',
      location: basicInfoData.schoolLocation,
      nature: basicInfoData.schoolNature,
      is985: basicInfoData.is985,
      is211: basicInfoData.is211
    },
    stats: {
      majorCount: uniqueMajors.length,
      admissionDataCount: majors.length,
      years: yearsData.map(y => y.year)
    },
    majors: uniqueMajors.map(m => ({
      name: m.major,
      code: m.majorCode || '-',
      minScore: m.minScore,
      minRank: m.minRank,
      category: m.category,
      batch: m.batch
    })),
    scoreTrends: scoreTrendsData.map(d => ({
      year: d.year,
      avgScore: Math.round(d.avg_score || 0),
      minScore: d.min_score || 0,
      maxScore: d.max_score || 0
    })),
    admissionData: admissionDataData.map(d => ({
      year: d.year,
      major: d.major,
      minScore: d.minScore,
      minRank: d.minRank,
      category: d.category,
      batch: d.batch
    }))
  };
}

export async function searchUniversities(keyword: string): Promise<Array<{ name: string; code: string; location: string }>> {
  const universities = await prisma.admissionData.findMany({
    where: {
      universityName: {
        contains: keyword,
        mode: 'insensitive'
      }
    },
    select: {
      universityName: true,
      universityCode: true,
      schoolLocation: true
    },
    distinct: ['universityName'],
    orderBy: { universityName: 'asc' },
    take: 20
  });

  return universities.map(u => ({
    name: u.universityName,
    code: u.universityCode || '-',
    location: u.schoolLocation
  }));
}

export async function getAllUniversities(page: number = 1, pageSize: number = 50) {
  const skip = (page - 1) * pageSize;

  const [universities, total] = await Promise.all([
    prisma.admissionData.findMany({
      select: {
        universityName: true,
        universityCode: true,
        schoolLocation: true,
        schoolNature: true,
        is985: true,
        is211: true
      },
      distinct: ['universityName'],
      orderBy: { universityName: 'asc' },
      skip,
      take: pageSize
    }),
    prisma.admissionData.groupBy({
      by: ['universityName'],
      _count: true
    })
  ]);

  return {
    universities: universities.map(u => ({
      name: u.universityName,
      code: u.universityCode || '-',
      location: u.schoolLocation,
      nature: u.schoolNature,
      is985: u.is985,
      is211: u.is211
    })),
    total: total.length,
    page,
    pageSize,
    totalPages: Math.ceil(total.length / pageSize)
  };
}
