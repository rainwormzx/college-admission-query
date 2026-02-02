// 录取数据接口
export interface AdmissionData {
  id: number;
  year: number;
  universityName: string;
  universityCode: string;
  category: string;
  batch: string;
  subjectRequirement: string;
  major: string;
  majorCode: string;
  majorGroup: string | null;
  majorNote: string | null;
  admissionCount: number | null;
  minScore: number | null;
  minRank: number | null;
  schoolLocation: string;
  schoolNature: string;
  is985: boolean;
  is211: boolean;
}

// 查询参数接口
export interface SearchParams {
  major?: string;
  universityName?: string;
  schoolLocation?: string | string[];
  minScore?: { min?: number; max?: number };
  minRank?: { min?: number; max?: number };
  year?: number[];
  category?: string;
  batch?: string;
  is985?: boolean;
  is211?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查询响应接口
export interface SearchResponse {
  data: AdmissionData[];
  total: number;
  page: number;
  pageSize: number;
}

// 统计数据接口
export interface StatsData {
  scoreDistribution: { score: number; count: number }[];
  locationStats: { location: string; count: number }[];
  majorStats: { major: string; count: number }[];
  yearlyTrend: { year: number; avgScore: number }[];
}

// 推荐参数接口
export interface RecommendParams {
  score: number;
  rank: number;
  year?: number;
  category?: string;
  subject?: string;
  schoolLocation?: string | string[];
}

// 推荐结果接口
export interface RecommendResult {
  冲刺: AdmissionData[];
  稳妥: AdmissionData[];
  保底: AdmissionData[];
}

// 对比参数接口
export interface CompareParams {
  university: string;
  major?: string;
  years: number[];
}

// 对比结果接口
export interface CompareResult {
  university: string;
  data: {
    year: number;
    majors: {
      major: string;
      minScore: number;
      minRank: number;
    }[];
  }[];
}

// 分数位次映射接口
export interface ScoreRankMapping {
  score?: number;
  rank?: number;
}
