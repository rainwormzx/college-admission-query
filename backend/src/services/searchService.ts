import prisma from '../utils/database';
import type { SearchParams, AdmissionData } from '../types';

export const searchAdmission = async (params: SearchParams) => {
  const {
    major,
    universityName,
    schoolLocation,
    minScore,
    minRank,
    year,
    category,
    batch,
    is985,
    is211,
    page = 1,
    pageSize = 20,
    sortBy = 'minScore',
    sortOrder = 'desc'
  } = params;

  const where: any = {};

  // 专业模糊查询
  if (major) {
    where.major = {
      contains: major,
      mode: 'insensitive'
    };
  }

  // 院校名称模糊查询
  if (universityName) {
    where.universityName = {
      contains: universityName,
      mode: 'insensitive'
    };
  }

  // 地区精确查询（支持多选）
  if (schoolLocation) {
    if (Array.isArray(schoolLocation) && schoolLocation.length > 0) {
      where.schoolLocation = {
        in: schoolLocation
      };
    } else if (typeof schoolLocation === 'string') {
      where.schoolLocation = schoolLocation;
    }
  }

  // 分数范围查询
  if (minScore?.min !== undefined || minScore?.max !== undefined) {
    where.minScore = {};
    if (minScore.min !== undefined) where.minScore.gte = minScore.min;
    if (minScore.max !== undefined) where.minScore.lte = minScore.max;
  }

  // 位次范围查询
  if (minRank?.min !== undefined || minRank?.max !== undefined) {
    where.minRank = {};
    if (minRank.min !== undefined) where.minRank.gte = minRank.min;
    if (minRank.max !== undefined) where.minRank.lte = minRank.max;
  }

  // 年份多选
  if (year && year.length > 0) {
    where.year = {
      in: year
    };
  }

  // 科类
  if (category) {
    where.category = category;
  }

  // 批次
  if (batch) {
    where.batch = batch;
  }

  // 985
  if (is985 !== undefined) {
    where.is985 = is985;
  }

  // 211
  if (is211 !== undefined) {
    where.is211 = is211;
  }

  // 排序
  let orderBy: any = {};
  if (sortBy && sortOrder) {
    const sortFieldMap: { [key: string]: string } = {
      minScore: 'minScore',
      minRank: 'minRank',
      year: 'year',
      universityName: 'universityName',
      major: 'major',
      schoolLocation: 'schoolLocation'
    };
    const prismaField = sortFieldMap[sortBy] || 'minScore';
    orderBy[prismaField] = sortOrder;
  } else {
    // 默认按分数降序
    orderBy = { minScore: 'desc' as const };
  }

  // 分页查询
  const [data, total] = await Promise.all([
    prisma.admissionData.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy
    }),
    prisma.admissionData.count({ where })
  ]);

  // 转换字段名（驼峰转下划线）
  const transformedData = data.map((item) => ({
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
    data: transformedData,
    total,
    page,
    pageSize
  };
};
