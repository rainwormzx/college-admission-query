import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  Empty,
  Typography
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  DeleteOutlined,
  ClearOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTargetUniversities } from '../contexts/TargetUniversitiesContext';
import type { TargetUniversity } from '../types';

const { Text } = Typography;

const TargetUniversitiesPage = () => {
  const navigate = useNavigate();
  const {
    targetUniversities,
    removeTargetUniversity,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    clearAll,
    exportToExcel
  } = useTargetUniversities();

  // 表格列定义
  const columns: ColumnsType<TargetUniversity> = [
    { title: '序号', width: 60, render: (_, __, index) => index + 1 },
    {
      title: '年份',
      dataIndex: 'year',
      width: 70,
      fixed: 'left'
    },
    {
      title: '院校名称',
      dataIndex: 'universityName',
      width: 200,
      fixed: 'left',
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
    { title: '专业', dataIndex: 'major', width: 180 },
    {
      title: '学科门类',
      dataIndex: 'subjectCategory',
      width: 90,
      render: (text: string | null) => text || '-'
    },
    { title: '批次', dataIndex: 'batch', width: 110 },
    { title: '选科要求', dataIndex: 'subjectRequirement', width: 120 },
    {
      title: '最低分数',
      dataIndex: 'minScore',
      width: 90,
      render: (value: number | null) => value || '-'
    },
    {
      title: '最低位次',
      dataIndex: 'minRank',
      width: 90,
      render: (value: number | null) => value ? value.toLocaleString() : '-'
    },
    { title: '学校所在', dataIndex: 'schoolLocation', width: 90 },
    {
      title: '专业备注',
      dataIndex: 'majorNote',
      width: 200,
      ellipsis: { showTitle: true },
      render: (text: string | null) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record, index) => (
        <Space size="small">
          <Button
            icon={<ArrowUpOutlined />}
            size="small"
            disabled={index === 0}
            onClick={() => moveUp(record.id)}
            title="上移"
          />
          <Button
            icon={<ArrowDownOutlined />}
            size="small"
            disabled={index === targetUniversities.length - 1}
            onClick={() => moveDown(record.id)}
            title="下移"
          />
          <Button
            icon={<VerticalAlignTopOutlined />}
            size="small"
            disabled={index === 0}
            onClick={() => moveToTop(record.id)}
            title="移至顶部"
          />
          <Button
            icon={<VerticalAlignBottomOutlined />}
            size="small"
            disabled={index === targetUniversities.length - 1}
            onClick={() => moveToBottom(record.id)}
            title="移至底部"
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => removeTargetUniversity(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              title="删除"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="我的目标院校"
        extra={
          targetUniversities.length > 0 && (
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportToExcel()}
              >
                导出Excel
              </Button>
              <Popconfirm
                title="确认清空"
                description="确定要清空所有目标院校吗？此操作不可恢复。"
                onConfirm={clearAll}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  icon={<ClearOutlined />}
                  danger
                >
                  清空全部
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {targetUniversities.length === 0 ? (
          <Empty
            description="暂无目标院校"
            style={{ padding: '60px 0' }}
          >
            <Button type="primary" onClick={() => navigate('/search')}>
              去查询添加
            </Button>
          </Empty>
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              共 {targetUniversities.length} 所目标院校，您可以通过右侧操作按钮调整优先级
            </Text>
            <Table
              columns={columns}
              dataSource={targetUniversities}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1400 }}
              size="small"
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default TargetUniversitiesPage;
