import prisma from '../utils/database';
import type { RecommendParams } from '../types';

export const getRecommend = async (params: RecommendParams) => {
  const { score, rank, year = 2025, category, subject, schoolLocation } = params;

  const baseWhere: any = {
    year
  };

  if (category) {
    baseWhere.category = category;
  }

  if (subject) {
    baseWhere.subjectRequirement = {
      contains: subject,
      mode: 'insensitive'
    };
  }

  // 地区筛选（支持多选）
  if (schoolLocation) {
    if (Array.isArray(schoolLocation) && schoolLocation.length > 0) {
      baseWhere.schoolLocation = {
        in: schoolLocation
      };
    } else if (typeof schoolLocation === 'string') {
      baseWhere.schoolLocation = schoolLocation;
    }
  }

  // 冲刺：分数高于考生5-10分
  const 冲刺 = await prisma.admissionData.findMany({
    where: {
      ...baseWhere,
      minScore: {
        gte: score + 5,
        lte: score + 10
      }
    },
    take: 20,
    orderBy: [
      { minScore: 'asc' }
    ]
  });

  // 稳妥：分数与考生相近（±3分）
  const 稳妥 = await prisma.admissionData.findMany({
    where: {
      ...baseWhere,
      minScore: {
        gte: score - 3,
        lte: score + 3
      }
    },
    take: 20,
    orderBy: [
      { minScore: 'desc' }
    ]
  });

  // 保底：分数低于考生10-20分
  const 保底 = await prisma.admissionData.findMany({
    where: {
      ...baseWhere,
      minScore: {
        gte: score - 20,
        lte: score - 10
      }
    },
    take: 20,
    orderBy: [
      { minScore: 'desc' }
    ]
  });

  const transformData = (items: any[]) => items.map((item) => ({
    id: item.id,
    year: item.year,
    universityName: item.universityName,
    universityCode: item.universityCode,
    category: item.category,
    batch: item.batch,
    subjectRequirement: item.subjectRequirement,
    major: item.major,
    majorCode: item.majorCode,
    majorGroup: item.majorGroup,
    majorNote: item.majorNote,
    admissionCount: item.admissionCount,
    minScore: item.minScore,
    minRank: item.minRank,
    schoolLocation: item.schoolLocation,
    schoolNature: item.schoolNature,
    is985: item.is985,
    is211: item.is211
  }));

  return {
    冲刺: transformData(冲刺),
    稳妥: transformData(稳妥),
    保底: transformData(保底)
  };
};
