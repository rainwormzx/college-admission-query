import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  AutoComplete
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  BookOutlined,
  RightOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './UniversityListPage.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface University {
  name: string;
  code: string;
  location: string;
  nature: string;
  is985: boolean;
  is211: boolean;
}

interface UniversityListResponse {
  universities: University[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const UniversityListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UniversityListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchOptions, setSearchOptions] = useState<{ value: string }[]>([]);
  // 预留筛选功能（暂时未实际使用）
  const [, setLocationFilter] = useState<string | undefined>();
  const [, setNatureFilter] = useState<string | undefined>();
  const [, setLevelFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchUniversities();
  }, [page, pageSize]);

  // 搜索建议
  const handleSearch = async (value: string) => {
    if (!value || value.length < 2) {
      setSearchOptions([]);
      return;
    }

    try {
      const response = await axios.get('/api/admission/universities/search', {
        params: { keyword: value }
      });
      setSearchOptions(response.data.map((u: any) => ({ value: u.name })));
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admission/universities', {
        params: { page, pageSize }
      });
      setData(response.data);
    } catch (error) {
      console.error('获取高校列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (record: University) => {
    navigate(`/university/${encodeURIComponent(record.name)}`);
  };

  const columns: ColumnsType<University> = [
    {
      title: '院校名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      fixed: 'left',
      render: (text: string, record: University) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            handleRowClick(record);
          }}
          style={{ fontWeight: 500, color: '#1890ff' }}
        >
          {text}
        </a>
      )
    },
    {
      title: '院校代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      align: 'center'
    },
    {
      title: '所在地',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (location: string) => (
        <Tag icon={<EnvironmentOutlined />} color="blue">
          {location}
        </Tag>
      )
    },
    {
      title: '办学性质',
      dataIndex: 'nature',
      key: 'nature',
      width: 120,
      render: (nature: string) => (
        <Tag icon={<BookOutlined />} color="purple">
          {nature}
        </Tag>
      )
    },
    {
      title: '院校层次',
      key: 'level',
      width: 180,
      render: (_, record: University) => (
        <Space>
          {record.is985 && (
            <Tag color="red" style={{ fontSize: 13 }}>
              985工程
            </Tag>
          )}
          {record.is211 && (
            <Tag color="orange" style={{ fontSize: 13 }}>
              211工程
            </Tag>
          )}
          {!record.is985 && !record.is211 && (
            <Tag color="default">普通本科</Tag>
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_, record: University) => (
        <Button
          type="link"
          onClick={() => handleRowClick(record)}
          icon={<RightOutlined />}
        >
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Card style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 16 }}>
          <BookOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          全国高校大全
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 24 }}>
          查看全国3000+所高校的详细信息，包括录取分数、专业设置、办学特色等
        </Paragraph>

        {/* 搜索和筛选 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSearch={handleSearch}
              onSelect={(value) => navigate(`/university/${encodeURIComponent(value)}`)}
              placeholder="搜索高校名称..."
              size="large"
            >
              <Input
                suffix={<SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
                placeholder="搜索高校名称..."
                size="large"
                onPressEnter={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  if (value) navigate(`/university/${encodeURIComponent(value)}`);
                }}
              />
            </AutoComplete>
          </Col>
          <Col span={4}>
            <Select
              placeholder="所在地区"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={setLocationFilter}
            >
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="广东">广东</Option>
              <Option value="江苏">江苏</Option>
              <Option value="浙江">浙江</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="办学性质"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={setNatureFilter}
            >
              <Option value="公办">公办</Option>
              <Option value="民办">民办</Option>
              <Option value="中外合作办学">中外合作办学</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="院校层次"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={setLevelFilter}
            >
              <Option value="985">985工程</Option>
              <Option value="211">211工程</Option>
              <Option value="普通">普通本科</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 高校列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.universities || []}
          rowKey="name"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 所高校`,
            pageSizeOptions: ['20', '50', '100', '200'],
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize || 50);
            }
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>
    </div>
  );
};

export default UniversityListPage;
