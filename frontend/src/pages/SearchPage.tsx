import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  InputNumber,
  message,
  Card
} from 'antd';
import { SearchOutlined, DownloadOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AdmissionData, SearchParams } from '../types';
import { searchAdmission, exportAdmission, getLocations } from '../services/api';
import { useTargetUniversities } from '../contexts/TargetUniversitiesContext';

const { Option } = Select;

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdmissionData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<AdmissionData[]>([]);
  const { batchAddTargetUniversities } = useTargetUniversities();

  // 用于取消未完成的请求，防止竞态条件
  const abortControllerRef = useRef<AbortController | null>(null);

  // 从 URL 获取查询参数
  const getQueryParams = (): SearchParams => {
    return {
      major: searchParams.get('major') || undefined,
      universityName: searchParams.get('universityName') || undefined,
      year: searchParams.get('year')?.split(',').map(Number).filter(Boolean) || undefined,
      schoolLocation: searchParams.get('schoolLocation')?.split(',').filter(Boolean) || undefined,
      category: searchParams.get('category') || undefined,
      subjectCategory: searchParams.get('subjectCategory')?.split(',').filter(Boolean) || undefined,
      batch: searchParams.get('batch') || undefined,
      is985: searchParams.get('is985') === 'true' ? true : searchParams.get('is985') === 'false' ? false : undefined,
      is211: searchParams.get('is211') === 'true' ? true : searchParams.get('is211') === 'false' ? false : undefined,
      minScore: searchParams.get('minScoreMin') || searchParams.get('minScoreMax') ? {
        min: searchParams.get('minScoreMin') ? Number(searchParams.get('minScoreMin')) : undefined,
        max: searchParams.get('minScoreMax') ? Number(searchParams.get('minScoreMax')) : undefined
      } : undefined,
      minRank: searchParams.get('minRankMin') || searchParams.get('minRankMax') ? {
        min: searchParams.get('minRankMin') ? Number(searchParams.get('minRankMin')) : undefined,
        max: searchParams.get('minRankMax') ? Number(searchParams.get('minRankMax')) : undefined
      } : undefined,
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 20,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined
    };
  };

  // 更新 URL 查询参数
  const updateQueryParams = (params: SearchParams) => {
    const newParams: Record<string, string> = {};

    if (params.major) newParams.major = params.major;
    if (params.universityName) newParams.universityName = params.universityName;
    if (params.year && params.year.length > 0) newParams.year = params.year.join(',');
    if (params.schoolLocation && params.schoolLocation.length > 0) {
      const location = Array.isArray(params.schoolLocation) ? params.schoolLocation.join(',') : params.schoolLocation;
      newParams.schoolLocation = location;
    }
    if (params.category) newParams.category = params.category;
    if (params.subjectCategory && params.subjectCategory.length > 0) {
      const categories = Array.isArray(params.subjectCategory) ? params.subjectCategory.join(',') : params.subjectCategory;
      newParams.subjectCategory = categories;
    }
    if (params.batch) newParams.batch = params.batch;
    if (params.is985 !== undefined) newParams.is985 = String(params.is985);
    if (params.is211 !== undefined) newParams.is211 = String(params.is211);
    if (params.minScore?.min) newParams.minScoreMin = String(params.minScore.min);
    if (params.minScore?.max) newParams.minScoreMax = String(params.minScore.max);
    if (params.minRank?.min) newParams.minRankMin = String(params.minRank.min);
    if (params.minRank?.max) newParams.minRankMax = String(params.minRank.max);
    if (params.page && params.page !== 1) newParams.page = String(params.page);
    if (params.pageSize && params.pageSize !== 20) newParams.pageSize = String(params.pageSize);
    if (params.sortBy) newParams.sortBy = params.sortBy;
    if (params.sortOrder) newParams.sortOrder = params.sortOrder;

    setSearchParams(newParams);
  };

  const [currentParams, setCurrentParams] = useState<SearchParams>(getQueryParams());

  // 加载所有地区
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locs = await getLocations();
        setLocations(locs);
      } catch (error) {
        console.error('获取地区列表失败', error);
      }
    };
    fetchLocations();
  }, []);

  // 监听 URL 参数变化，自动执行查询
  useEffect(() => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const params = getQueryParams();
    setCurrentParams(params);
    setPage(params.page || 1);
    setPageSize(params.pageSize || 20);

    // 无论是否有查询条件，都执行查询
    // 没有条件时显示所有数据
    performSearch(params, abortController.signal);

    // 清理函数：组件卸载或参数变化时取消请求
    return () => {
      abortController.abort();
    };
  }, [searchParams]);

  // 执行查询
  const performSearch = async (params: SearchParams, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const result = await searchAdmission(params, signal);

      // 如果请求被取消，不更新状态
      if (signal?.aborted) {
        return;
      }

      setData(result.data);
      setTotal(result.total);
    } catch (error: any) {
      // 如果是取消错误，不显示错误消息
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }
      message.error('查询失败');
    } finally {
      // 只有在请求没有被取消时才设置loading为false
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  // 批量保存功能
  const handleBatchSave = () => {
    if (selectedRecords.length === 0) {
      message.warning('请先选择要保存的记录');
      return;
    }

    // 使用批量添加方法
    const { addedCount, skippedCount } = batchAddTargetUniversities(selectedRecords);

    if (addedCount > 0) {
      message.success(
        `成功添加 ${addedCount} 条记录${skippedCount > 0 ? `，${skippedCount} 条已存在` : ''}`
      );
    } else {
      message.warning(`选中的 ${selectedRecords.length} 条记录都已存在`);
    }

    setSelectedRecords([]);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<AdmissionData> = [
    {
      title: (
        <input
          type="checkbox"
          checked={data.length > 0 && selectedRowKeys.length > 0 && data.every(item => selectedRowKeys.includes(item.id))}
          onChange={(e) => {
            if (e.target.checked) {
              // 选中当前页所有记录，添加完整数据
              const newRecords = [...selectedRecords];
              data.forEach(item => {
                if (!selectedRowKeys.includes(item.id)) {
                  newRecords.push(item);
                }
              });
              setSelectedRecords(newRecords);
              setSelectedRowKeys(newRecords.map(r => r.id));
            } else {
              // 取消选中当前页所有记录
              const currentPageIds = new Set(data.map(item => item.id));
              setSelectedRecords(selectedRecords.filter(r => !currentPageIds.has(r.id)));
              setSelectedRowKeys(selectedRowKeys.filter(id => !currentPageIds.has(id)));
            }
          }}
        />
      ),
      dataIndex: 'id',
      width: 60,
      fixed: 'left',
      render: (id: number, record: AdmissionData) => (
        <input
          type="checkbox"
          checked={selectedRowKeys.includes(id)}
          onChange={(e) => {
            if (e.target.checked) {
              // 选中时保存完整记录
              setSelectedRecords([...selectedRecords, record]);
              setSelectedRowKeys([...selectedRowKeys, id]);
            } else {
              // 取消选中时移除记录
              setSelectedRecords(selectedRecords.filter(r => r.id !== id));
              setSelectedRowKeys(selectedRowKeys.filter(key => key !== id));
            }
          }}
        />
      )
    },
    { title: '年份', dataIndex: 'year', width: 70, sorter: true },
    {
      title: '院校名称',
      dataIndex: 'universityName',
      width: 180,
      sorter: true,
      render: (text: string) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            navigate(`/university/${encodeURIComponent(text)}`);
          }}
          style={{
            color: '#1890ff',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {text}
        </a>
      )
    },
    { title: '专业', dataIndex: 'major', width: 180, sorter: true },
    { title: '学科门类', dataIndex: 'subjectCategory', width: 90, sorter: true, render: (text: string | null) => text || '-' },
    { title: '批次', dataIndex: 'batch', width: 110, sorter: true },
    { title: '选科要求', dataIndex: 'subjectRequirement', width: 120, sorter: true },
    {
      title: '最低分数',
      dataIndex: 'minScore',
      width: 90,
      sorter: true
    },
    {
      title: '最低位次',
      dataIndex: 'minRank',
      width: 90,
      sorter: true
    },
    { title: '学校所在', dataIndex: 'schoolLocation', width: 90, sorter: true },
    {
      title: '专业备注',
      dataIndex: 'majorNote',
      width: 300,
      ellipsis: {
        showTitle: true
      },
      render: (text: string | null) => text || '-'
    }
  ];

  const handleSearch = () => {
    const params = {
      ...currentParams,
      page: 1,
      pageSize
    };
    updateQueryParams(params);
  };

  const handleExport = async () => {
    try {
      const blob = await exportAdmission(currentParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `查询结果_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleReset = () => {
    // 清空所有查询参数
    const emptyParams: SearchParams = {
      page: 1,
      pageSize: 20
    };
    updateQueryParams(emptyParams);
    message.success('已重置筛选条件');
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    const newPage = pagination.current;
    const newPageSize = pagination.pageSize;

    const newParams: SearchParams = {
      ...currentParams,
      page: newPage,
      pageSize: newPageSize,
      sortBy: sorter?.field,
      sortOrder: sorter?.order === 'ascend' ? 'asc' : sorter?.order === 'descend' ? 'desc' : undefined
    };

    updateQueryParams(newParams);
  };

  // 更新单个查询参数
  const updateParam = (key: keyof SearchParams, value: any) => {
    const newParams = { ...currentParams, [key]: value };
    setCurrentParams(newParams);
  };

  return (
    <div>
      <Card title="查询条件" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Input
              placeholder="专业名称"
              style={{ width: 200 }}
              value={currentParams.major}
              onChange={(e) => updateParam('major', e.target.value)}
            />
            <Input
              placeholder="院校名称"
              style={{ width: 200 }}
              value={currentParams.universityName}
              onChange={(e) => updateParam('universityName', e.target.value)}
            />
            <Select
              mode="multiple"
              placeholder="年份"
              style={{ width: 200 }}
              allowClear
              value={currentParams.year}
              onChange={(values) => updateParam('year', values)}
            >
              <Option value={2022}>2022年</Option>
              <Option value={2023}>2023年</Option>
              <Option value={2024}>2024年</Option>
              <Option value={2025}>2025年</Option>
            </Select>
            <Select
              mode="multiple"
              placeholder="院校地区"
              style={{ width: 200 }}
              allowClear
              showSearch
              value={currentParams.schoolLocation}
              onChange={(values) => updateParam('schoolLocation', values)}
              maxTagCount="responsive"
            >
              {locations.map((loc) => (
                <Option key={loc} value={loc}>{loc}</Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              placeholder="学科门类（可多选）"
              style={{ width: 200 }}
              allowClear
              maxTagCount="responsive"
              value={currentParams.subjectCategory}
              onChange={(value) => updateParam('subjectCategory', value)}
            >
              <Option value="哲学">哲学</Option>
              <Option value="经济学">经济学</Option>
              <Option value="法学">法学</Option>
              <Option value="教育学">教育学</Option>
              <Option value="文学">文学</Option>
              <Option value="历史学">历史学</Option>
              <Option value="理学">理学</Option>
              <Option value="工学">工学</Option>
              <Option value="农学">农学</Option>
              <Option value="医学">医学</Option>
              <Option value="管理学">管理学</Option>
              <Option value="艺术学">艺术学</Option>
              <Option value="综合">综合</Option>
            </Select>
            <Select
              placeholder="是否985"
              style={{ width: 120 }}
              allowClear
              value={currentParams.is985}
              onChange={(value) => updateParam('is985', value)}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Space>

          <Space wrap>
            <InputNumber
              placeholder="最低分数"
              style={{ width: 120 }}
              value={currentParams.minScore?.min}
              onChange={(value) => updateParam('minScore', { ...currentParams.minScore, min: value || undefined })}
            />
            <InputNumber
              placeholder="最高分数"
              style={{ width: 120 }}
              value={currentParams.minScore?.max}
              onChange={(value) => updateParam('minScore', { ...currentParams.minScore, max: value || undefined })}
            />
            <InputNumber
              placeholder="最低位次"
              style={{ width: 120 }}
              value={currentParams.minRank?.min}
              onChange={(value) => updateParam('minRank', { ...currentParams.minRank, min: value || undefined })}
            />
            <InputNumber
              placeholder="最高位次"
              style={{ width: 120 }}
              value={currentParams.minRank?.max}
              onChange={(value) => updateParam('minRank', { ...currentParams.minRank, max: value || undefined })}
            />
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
          </Space>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      {/* 浮动保存按钮 */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 100,
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Space direction="vertical" size="small">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleBatchSave}
              style={{
                borderRadius: 30,
                height: 50,
                paddingLeft: 24,
                paddingRight: 24,
                fontSize: 16
              }}
            >
              保存选中 ({selectedRowKeys.length})
            </Button>
            <Button
              size="small"
              onClick={() => {
                setSelectedRowKeys([]);
                setSelectedRecords([]);
              }}
              style={{
                borderRadius: 20,
                marginLeft: 'auto'
              }}
            >
              取消选择
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
