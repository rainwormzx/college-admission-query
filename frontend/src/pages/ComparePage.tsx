import { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Table,
  message,
  Space
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import type { CompareParams, CompareResult } from '../types';
import { getCompare } from '../services/api';

const { Option } = Select;

interface CompareDataType {
  key: string;
  year: number;
  major: string;
  minScore: number;
  minRank: number;
}

const ComparePage = () => {
  const [loading, setLoading] = useState(false);
  const [university, setUniversity] = useState<string>('');
  const [major, setMajor] = useState<string>('');
  const [years, setYears] = useState<number[]>([2022, 2023, 2024, 2025]);
  const [data, setData] = useState<CompareResult | null>(null);

  const columns: ColumnsType<CompareDataType> = [
    { title: '年份', dataIndex: 'year', width: 100 },
    { title: '专业', dataIndex: 'major', width: 250 },
    { title: '最低分数', dataIndex: 'minScore', width: 120 },
    { title: '最低位次', dataIndex: 'minRank', width: 120 }
  ];

  const handleCompare = async () => {
    if (!university) {
      message.warning('请输入院校名称');
      return;
    }

    setLoading(true);
    try {
      const params: CompareParams = {
        university,
        major: major || undefined,
        years
      };
      const result = await getCompare(params);
      setData(result);
    } catch (error) {
      message.error('获取对比数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!data) return [];

    const majorScores: { [key: string]: number[] } = {};

    data.data.forEach((yearData) => {
      yearData.majors.forEach((m) => {
        if (!majorScores[m.major]) {
          majorScores[m.major] = [];
        }
        majorScores[m.major][yearData.year - 2022] = m.minScore;
      });
    });

    return Object.keys(majorScores).map((majorName) => ({
      name: majorName,
      type: 'line',
      data: majorScores[majorName]
    }));
  };

  const getChartOption = () => ({
    title: { text: `${university} - 专业分数趋势` },
    tooltip: { trigger: 'axis' },
    legend: { data: data?.data.map((d) => d.year.toString()) },
    xAxis: {
      type: 'category',
      data: years.map(String)
    },
    yAxis: { type: 'value', name: '分数' },
    series: getChartData()
  });

  const getTableData = (): CompareDataType[] => {
    if (!data) return [];

    const tableData: CompareDataType[] = [];
    data.data.forEach((yearData) => {
      yearData.majors.forEach((m) => {
        tableData.push({
          key: `${yearData.year}-${m.major}`,
          year: yearData.year,
          major: m.major,
          minScore: m.minScore,
          minRank: m.minRank
        });
      });
    });
    return tableData;
  };

  return (
    <div>
      <Card title="多年对比" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="请输入院校名称"
              style={{ width: 250 }}
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
            <Input
              placeholder="专业名称（可选）"
              style={{ width: 250 }}
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />
          </Space>

          <Space>
            <span>选择年份：</span>
            <Select
              mode="multiple"
              defaultValue={[2022, 2023, 2024, 2025]}
              style={{ width: 300 }}
              onChange={(value) => setYears(value)}
            >
              <Option value={2022}>2022年</Option>
              <Option value={2023}>2023年</Option>
              <Option value={2024}>2024年</Option>
              <Option value={2025}>2025年</Option>
            </Select>
          </Space>

          <Button type="primary" onClick={handleCompare} loading={loading}>
            对比
          </Button>
        </Space>
      </Card>

      {data && (
        <>
          <Card title="分数趋势图" style={{ marginBottom: 16 }}>
            <ReactECharts option={getChartOption()} />
          </Card>

          <Card title="详细数据">
            <Table
              columns={columns}
              dataSource={getTableData()}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ComparePage;
