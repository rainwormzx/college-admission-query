import axios from 'axios';
import type {
  SearchParams,
  SearchResponse,
  StatsData,
  RecommendParams,
  RecommendResult,
  CompareParams,
  CompareResult,
  ScoreRankMapping
} from '../types';

const API_BASE_URL = '/api';

// 获取 token
const getToken = (): string | null => {
  return sessionStorage.getItem('auth_token');
};

// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 登出
export const logout = () => {
  sessionStorage.removeItem('auth_token');
};

// 查询接口
export const searchAdmission = async (
  params: SearchParams,
  signal?: AbortSignal
): Promise<SearchResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/admission/search`,
    params,
    { signal }
  );
  return response.data;
};

// 导出接口
export const exportAdmission = async (params: SearchParams): Promise<Blob> => {
  const response = await axios.post(
    `${API_BASE_URL}/admission/export`,
    params,
    {
      responseType: 'blob'
    }
  );
  return response.data;
};

// 统计接口
export const getStats = async (
  year?: number,
  major?: string,
  schoolLocation?: string
): Promise<StatsData> => {
  const params: any = {};
  if (year) params.year = year;
  if (major) params.major = major;
  if (schoolLocation) params.schoolLocation = schoolLocation;

  const response = await axios.get(`${API_BASE_URL}/admission/stats`, {
    params
  });
  return response.data;
};

// 推荐接口
export const getRecommend = async (
  params: RecommendParams
): Promise<RecommendResult> => {
  const response = await axios.post(
    `${API_BASE_URL}/admission/recommend`,
    params
  );
  return response.data;
};

// 对比接口
export const getCompare = async (
  params: CompareParams
): Promise<CompareResult> => {
  const response = await axios.post(
    `${API_BASE_URL}/admission/compare`,
    params
  );
  return response.data;
};

// 获取所有年份
export const getYears = async (): Promise<number[]> => {
  const response = await axios.get(`${API_BASE_URL}/admission/years`);
  return response.data;
};

// 获取所有地区
export const getLocations = async (): Promise<string[]> => {
  const response = await axios.get(`${API_BASE_URL}/admission/locations`);
  return response.data;
};

// 分数位次映射接口
export const getScoreRankMapping = async (
  year: number,
  score?: number,
  rank?: number
): Promise<ScoreRankMapping> => {
  const params: any = { year };
  if (score !== undefined) params.score = score;
  if (rank !== undefined) params.rank = rank;

  const response = await axios.get(`${API_BASE_URL}/admission/score-rank-mapping`, {
    params
  });
  return response.data;
};
