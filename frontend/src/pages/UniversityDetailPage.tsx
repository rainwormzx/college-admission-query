import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
  Table,
  Tabs,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Badge
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  BookOutlined,
  RiseOutlined,
  TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './UniversityDetailPage.css';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface UniversityDetail {
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

const UniversityDetailPage = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState<UniversityDetail | null>(null);

  useEffect(() => {
    const fetchUniversity = async () => {
      if (!name) return;

      setLoading(true);
      try {
        const response = await axios.get(`/api/admission/university/${encodeURIComponent(name)}`);
        setUniversity(response.data);
      } catch (error) {
        console.error('获取高校详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversity();
  }, [name]);

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Card loading={loading} />
      </div>
    );
  }

  if (!university) {
    return (
      <div style={{ padding: '50px' }}>
        <Alert
          message="未找到该高校信息"
          description="请检查高校名称是否正确"
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate(-1)}>返回</Button>
          }
        />
      </div>
    );
  }

  const { basicInfo, stats, majors, scoreTrends, admissionData } = university;

  // 专业列表表格列
  const majorColumns: ColumnsType<typeof majors[0]> = [
    { title: '专业名称', dataIndex: 'name', width: 250, fixed: 'left' as const },
    { title: '专业代码', dataIndex: 'code', width: 120 },
    { title: '科类', dataIndex: 'category', width: 100 },
    { title: '批次', dataIndex: 'batch', width: 100 },
    { title: '最低分数', dataIndex: 'minScore', width: 100, render: (v) => v || '-' },
    { title: '最低位次', dataIndex: 'minRank', width: 100, render: (v) => v ? v.toLocaleString() : '-' }
  ];

  // 分数趋势图表数据
  const trendColumns: ColumnsType<typeof scoreTrends[0]> = [
    { title: '年份', dataIndex: 'year', width: 100 },
    { title: '平均分', dataIndex: 'avgScore', width: 120 },
    { title: '最低分', dataIndex: 'minScore', width: 120 },
    { title: '最高分', dataIndex: 'maxScore', width: 120 }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      {/* 头部信息卡片 */}
      <Card
        className="university-header-card"
        style={{ marginBottom: 24 }}
      >
        <Row gutter={24} align="middle">
          <Col span={18}>
            <Space direction="vertical" size="large">
              <div>
                <Title level={2} style={{ marginBottom: 8, color: '#1890ff' }}>
                  {basicInfo.name}
                </Title>
                <Space size="middle" wrap>
                  <Tag icon={<EnvironmentOutlined />} color="blue">
                    {basicInfo.location}
                  </Tag>
                  <Tag icon={<BookOutlined />} color="purple">
                    {basicInfo.nature}
                  </Tag>
                  {basicInfo.is985 && (
                    <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
                      985工程
                    </Tag>
                  )}
                  {basicInfo.is211 && (
                    <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                      211工程
                    </Tag>
                  )}
                  {!basicInfo.is985 && !basicInfo.is211 && (
                    <Tag color="default">普通本科</Tag>
                  )}
                </Space>
              </div>
            </Space>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <div className="university-code">
              <Text type="secondary">院校代码</Text>
              <Title level={3} style={{ color: '#1890ff', margin: '8px 0' }}>
                {basicInfo.code}
              </Title>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计数据 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="开设专业数"
              value={stats.majorCount}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="录取数据条目"
              value={stats.admissionDataCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据年份跨度"
              value={stats.years.length}
              suffix="年"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="院校层次"
              value={basicInfo.is985 ? "顶尖" : basicInfo.is211 ? "重点" : "普通"}
              valueStyle={{ color: basicInfo.is985 ? '#cf1322' : basicInfo.is211 ? '#fa541c' : '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详情标签页 */}
      <Card>
        <Tabs defaultActiveKey="overview">
          <TabPane tab="概览" key="overview">
            <div className="overview-section">
              <Title level={4}>基本信息</Title>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="院校名称">{basicInfo.name}</Descriptions.Item>
                <Descriptions.Item label="院校代码">{basicInfo.code}</Descriptions.Item>
                <Descriptions.Item label="所在地">
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  {basicInfo.location}
                </Descriptions.Item>
                <Descriptions.Item label="办学性质">
                  <Badge status={basicInfo.nature === '公办' ? 'success' : 'default'} text={basicInfo.nature} />
                </Descriptions.Item>
                <Descriptions.Item label="985工程">
                  {basicInfo.is985 ? (
                    <Tag color="red">是</Tag>
                  ) : (
                    <Tag color="default">否</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="211工程">
                  {basicInfo.is211 ? (
                    <Tag color="orange">是</Tag>
                  ) : (
                    <Tag color="default">否</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Title level={4}>分数趋势分析</Title>
              {scoreTrends.length > 0 ? (
                <Table
                  columns={trendColumns}
                  dataSource={scoreTrends}
                  rowKey="year"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Alert message="暂无分数趋势数据" type="info" showIcon />
              )}
            </div>
          </TabPane>

          <TabPane tab={`专业列表 (${majors.length})`} key="majors">
            <Table
              columns={majorColumns}
              dataSource={majors}
              rowKey={(record) => record.name + record.code}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个专业`
              }}
              scroll={{ x: 900 }}
              size="small"
            />
          </TabPane>

          <TabPane tab={`录取数据 (${admissionData.length})`} key="admission">
            <Table
              columns={[
                { title: '年份', dataIndex: 'year', width: 80, fixed: 'left' as const },
                { title: '专业', dataIndex: 'major', width: 250, fixed: 'left' as const },
                { title: '科类', dataIndex: 'category', width: 100 },
                { title: '批次', dataIndex: 'batch', width: 100 },
                { title: '最低分', dataIndex: 'minScore', width: 100, render: (v) => v || '-' },
                { title: '最低位次', dataIndex: 'minRank', width: 120, render: (v) => v ? v.toLocaleString() : '-' }
              ]}
              dataSource={admissionData}
              rowKey={(record) => `${record.year}-${record.major}`}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条数据`
              }}
              scroll={{ x: 800 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 数据来源说明 */}
      <Card style={{ marginTop: 24, background: '#f0f2f5' }}>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
          <BookOutlined style={{ marginRight: 8 }} />
          数据来源：本页面数据来源于官方公布的录取数据，仅供参考。具体录取信息以各省教育考试院和高校招生网公布为准。
        </Paragraph>
      </Card>
    </div>
  );
};

export default UniversityDetailPage;
