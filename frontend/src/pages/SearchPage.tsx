import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  InputNumber,
  message,
  Card,
  Checkbox
} from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AdmissionData, SearchParams } from '../types';
import { searchAdmission, exportAdmission, getLocations } from '../services/api';

const { Option } = Select;

const SearchPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdmissionData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [locations, setLocations] = useState<string[]>([]);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    pageSize: 20
  });

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

  const columns: ColumnsType<AdmissionData> = [
    { title: '年份', dataIndex: 'year', width: 70, sorter: true },
    { title: '院校名称', dataIndex: 'universityName', width: 180, sorter: true },
    { title: '专业', dataIndex: 'major', width: 180, sorter: true },
    { title: '学科门类', dataIndex: 'category', width: 90, sorter: true },
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

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await searchAdmission({
        ...searchParams,
        page,
        pageSize
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportAdmission(searchParams);
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

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const newPage = pagination.current;
    const newPageSize = pagination.pageSize;
    setPage(newPage);
    setPageSize(newPageSize);

    const newParams: SearchParams = {
      ...searchParams,
      page: newPage,
      pageSize: newPageSize,
      sortBy: sorter.field,
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    };

    setSearchParams(newParams);

    searchAdmission(newParams).then((result) => {
      setData(result.data);
      setTotal(result.total);
    });
  };

  return (
    <div>
      <Card title="查询条件" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Input
              placeholder="专业名称"
              style={{ width: 200 }}
              onChange={(e) =>
                setSearchParams({ ...searchParams, major: e.target.value })
              }
            />
            <Input
              placeholder="院校名称"
              style={{ width: 200 }}
              onChange={(e) =>
                setSearchParams({ ...searchParams, universityName: e.target.value })
              }
            />
            <Select
              mode="multiple"
              placeholder="年份"
              style={{ width: 200 }}
              allowClear
              onChange={(values) =>
                setSearchParams({ ...searchParams, year: values })
              }
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
              onChange={(values) =>
                setSearchParams({ ...searchParams, schoolLocation: values && values.length > 0 ? values as any : undefined })
              }
              maxTagCount="responsive"
            >
              {locations.map((loc) => (
                <Option key={loc} value={loc}>{loc}</Option>
              ))}
            </Select>
            <Select
              placeholder="学科门类"
              style={{ width: 150 }}
              allowClear
              onChange={(value) =>
                setSearchParams({ ...searchParams, category: value })
              }
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
              onChange={(value) =>
                setSearchParams({ ...searchParams, is985: value })
              }
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Space>

          <Space wrap>
            <InputNumber
              placeholder="最低分数"
              style={{ width: 120 }}
              onChange={(value) =>
                setSearchParams({
                  ...searchParams,
                  minScore: { ...searchParams.minScore, min: value || undefined }
                })
              }
            />
            <InputNumber
              placeholder="最高分数"
              style={{ width: 120 }}
              onChange={(value) =>
                setSearchParams({
                  ...searchParams,
                  minScore: { ...searchParams.minScore, max: value || undefined }
                })
              }
            />
            <InputNumber
              placeholder="最低位次"
              style={{ width: 120 }}
              onChange={(value) =>
                setSearchParams({
                  ...searchParams,
                  minRank: { ...searchParams.minRank, min: value || undefined }
                })
              }
            />
            <InputNumber
              placeholder="最高位次"
              style={{ width: 120 }}
              onChange={(value) =>
                setSearchParams({
                  ...searchParams,
                  minRank: { ...searchParams.minRank, max: value || undefined }
                })
              }
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
    </div>
  );
};

export default SearchPage;
