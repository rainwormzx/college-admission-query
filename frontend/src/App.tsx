import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  SearchOutlined,
  BarChartOutlined,
  StarOutlined,
  SwapOutlined
} from '@ant-design/icons';
import SearchPage from './pages/SearchPage';
import StatsPage from './pages/StatsPage';
import RecommendPage from './pages/RecommendPage';
import ComparePage from './pages/ComparePage';
import './index.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [selectedKey, setSelectedKey] = useState('search');

  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const menuItems = [
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '查询'
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: '统计'
    },
    {
      key: 'recommend',
      icon: <StarOutlined />,
      label: '志愿推荐'
    },
    {
      key: 'compare',
      icon: <SwapOutlined />,
      label: '多年对比'
    }
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'search':
        return <SearchPage />;
      case 'stats':
        return <StatsPage />;
      case 'recommend':
        return <RecommendPage />;
      case 'compare':
        return <ComparePage />;
      default:
        return <SearchPage />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          高考志愿填报查询系统
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
