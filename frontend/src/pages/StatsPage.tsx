import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { getStats } from '../services/api';

const { Option } = Select;

const StatsPage = () => {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(2025);
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [locationStats, setLocationStats] = useState<any[]>([]);
  const [majorStats, setMajorStats] = useState<any[]>([]);
  const [yearlyTrend, setYearlyTrend] = useState<any[]>([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getStats(year);
      setScoreDistribution(data.scoreDistribution);
      setLocationStats(data.locationStats);
      setMajorStats(data.majorStats.slice(0, 20));
      setYearlyTrend(data.yearlyTrend);
    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [year]);

  const getScoreDistributionOption = (): EChartsOption => ({
    title: { text: '分数分布' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: scoreDistribution.map((item) => item.score),
      name: '分数'
    },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        data: scoreDistribution.map((item) => item.count),
        type: 'bar',
        itemStyle: { color: '#3b82f6' }
      }
    ]
  });

  const getLocationOption = (): EChartsOption => ({
    title: { text: '地区分布' },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '院校数量',
        type: 'pie',
        radius: '50%',
        data: locationStats.map((item) => ({
          value: item.count,
          name: item.location
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  });

  const getMajorOption = (): EChartsOption => ({
    title: { text: '专业热度TOP20' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: majorStats.map((item) => item.major),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        data: majorStats.map((item) => item.count),
        type: 'bar',
        itemStyle: { color: '#10b981' }
      }
    ]
  });

  const getTrendOption = (): EChartsOption => ({
    title: { text: '年份趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: yearlyTrend.map((item) => item.year),
      name: '年份'
    },
    yAxis: { type: 'value', name: '平均分数' },
    series: [
      {
        data: yearlyTrend.map((item) => item.avgScore),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#f59e0b' }
      }
    ]
  });

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Select
          defaultValue={2025}
          style={{ width: 200 }}
          onChange={(value) => setYear(value)}
        >
          <Option value={2022}>2022年</Option>
          <Option value={2023}>2023年</Option>
          <Option value={2024}>2024年</Option>
          <Option value={2025}>2025年</Option>
        </Select>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <ReactECharts option={getScoreDistributionOption()} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <ReactECharts option={getLocationOption()} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <ReactECharts option={getMajorOption()} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <ReactECharts option={getTrendOption()} />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default StatsPage;
