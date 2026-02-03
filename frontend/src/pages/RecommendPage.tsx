import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  InputNumber,
  Button,
  Table,
  Tabs,
  message,
  Space,
  Select,
  Divider,
  Statistic,
  Row,
  Col
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AdmissionData, RecommendParams } from '../types';
import { getRecommend, getLocations } from '../services/api';

const { Option } = Select;

const RecommendPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(2025);
  const [score, setScore] = useState<number | undefined>();
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [results, setResults] = useState<{
    冲刺: AdmissionData[];
    稳妥: AdmissionData[];
    保底: AdmissionData[];
  }>({ 冲刺: [], 稳妥: [], 保底: [] });

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
    {
      title: '院校名称',
      dataIndex: 'universityName',
      width: 200,
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
    { title: '专业', dataIndex: 'major', width: 200 },
    { title: '最低分数', dataIndex: 'minScore', width: 100 },
    { title: '最低位次', dataIndex: 'minRank', width: 100 },
    { title: '学校所在', dataIndex: 'schoolLocation', width: 100 },
    { title: '是否985', dataIndex: 'is985', width: 100, render: (v) => (v ? '是' : '否') },
    { title: '是否211', dataIndex: 'is211', width: 100, render: (v) => (v ? '是' : '否') }
  ];

  const handleRecommend = async () => {
    if (!score) {
      message.warning('请输入分数');
      return;
    }

    setLoading(true);
    try {
      const params: RecommendParams = {
        score,
        rank: 0, // 不再使用，但为了兼容接口保留
        year,
        schoolLocation: selectedLocations.length > 0 ? selectedLocations : undefined
      };
      const data = await getRecommend(params);
      setResults(data);
    } catch (error) {
      message.error('获取推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: '冲刺',
      label: `冲刺院校 (${results.冲刺.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={results.冲刺}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      )
    },
    {
      key: '稳妥',
      label: `稳妥院校 (${results.稳妥.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={results.稳妥}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      )
    },
    {
      key: '保底',
      label: `保底院校 (${results.保底.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={results.保底}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      )
    }
  ];

  return (
    <div>
      <Card title="志愿推荐" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <span>参考年份：</span>
            <Select
              defaultValue={2025}
              style={{ width: 120 }}
              onChange={(value) => setYear(value)}
            >
              <Option value={2022}>2022年</Option>
              <Option value={2023}>2023年</Option>
              <Option value={2024}>2024年</Option>
              <Option value={2025}>2025年</Option>
            </Select>
            <Select
              mode="multiple"
              placeholder="院校地区（可选）"
              style={{ width: 250 }}
              allowClear
              showSearch
              onChange={(values) => setSelectedLocations(values)}
              maxTagCount="responsive"
            >
              {locations.map((loc) => (
                <Option key={loc} value={loc}>{loc}</Option>
              ))}
            </Select>
          </Space>

          <Space>
            <span>请输入您的分数：</span>
            <InputNumber
              placeholder="请输入分数"
              style={{ width: 200 }}
              value={score}
              onChange={(value) => setScore(value ?? undefined)}
              min={0}
              max={750}
            />
          </Space>

          <Button type="primary" onClick={handleRecommend} loading={loading} size="large">
            获取推荐
          </Button>

          {results.冲刺.length > 0 && (
            <>
              <Divider />
              <Row gutter={16}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="冲刺"
                      value={results.冲刺.length}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="稳妥"
                      value={results.稳妥.length}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="保底"
                      value={results.保底.length}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Space>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default RecommendPage;
