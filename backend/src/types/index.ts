// 录取数据类型
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
  subjectCategory: string | null;
}

// 查询参数类型
export interface SearchParams {
  major?: string;
  universityName?: string;
  schoolLocation?: string | string[];
  minScore?: { min?: number; max?: number };
  minRank?: { min?: number; max?: number };
  year?: number[];
  category?: string;
  subjectCategory?: string | string[];
  batch?: string;
  is985?: boolean;
  is211?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 推荐参数类型
export interface RecommendParams {
  score: number;
  rank: number;
  year?: number;
  category?: string;
  subject?: string;
  schoolLocation?: string | string[];
}

// 对比参数类型
export interface CompareParams {
  university: string;
  major?: string;
  years: number[];
}
