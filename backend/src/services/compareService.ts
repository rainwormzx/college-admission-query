import prisma from '../utils/database';
import type { CompareParams } from '../types';

export const getCompare = async (params: CompareParams) => {
  const { university, major, years } = params;

  const where: any = {
    universityName: {
      contains: university,
      mode: 'insensitive'
    },
    year: {
      in: years
    }
  };

  if (major) {
    where.major = {
      contains: major,
      mode: 'insensitive'
    };
  }

  const data = await prisma.admissionData.findMany({
    where,
    orderBy: [
      { year: 'asc' },
      { major: 'asc' }
    ]
  });

  // 按年份分组
  const groupedByYear: { [key: number]: any[] } = {};

  data.forEach((item) => {
    if (!groupedByYear[item.year]) {
      groupedByYear[item.year] = [];
    }

    groupedByYear[item.year].push({
      major: item.major,
      minScore: item.minScore,
      minRank: item.minRank
    });
  });

  // 转换为所需格式
  const result = {
    university,
    data: Object.keys(groupedByYear)
      .map((yearStr) => ({
        year: parseInt(yearStr),
        majors: groupedByYear[parseInt(yearStr)]
      }))
      .sort((a, b) => a.year - b.year)
  };

  return result;
};
