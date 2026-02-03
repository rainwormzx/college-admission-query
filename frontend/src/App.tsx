import { useState } from 'react';
import { Layout, Menu, theme, Button } from 'antd';
import { useNavigate, useLocation, Route, Routes, Navigate } from 'react-router-dom';
import {
  SearchOutlined,
  BarChartOutlined,
  StarOutlined,
  SwapOutlined,
  RobotOutlined,
  UnorderedListOutlined,
  HeartFilled
} from '@ant-design/icons';
import SearchPage from './pages/SearchPage';
import StatsPage from './pages/StatsPage';
import RecommendPage from './pages/RecommendPage';
import ComparePage from './pages/ComparePage';
import AIAssistantPage from './pages/AIAssistantPage';
import UniversityListPage from './pages/UniversityListPage';
import UniversityDetailPage from './pages/UniversityDetailPage';
import TargetUniversitiesPage from './pages/TargetUniversitiesPage';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { logout } from './services/api';
import './index.css';

const { Header, Content, Sider } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedKey, setSelectedKey] = useState(() => {
    const path = location.pathname;
    if (path === '/') return 'search';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/target')) return 'target';
    if (path.startsWith('/stats')) return 'stats';
    if (path.startsWith('/recommend')) return 'recommend';
    if (path.startsWith('/compare')) return 'compare';
    if (path.startsWith('/ai')) return 'ai';
    if (path.startsWith('/universities')) return 'universities';
    if (path.startsWith('/university')) return 'universities';
    return 'search';
  });

  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const menuItems = [
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '查询',
      path: '/search'
    },
    {
      key: 'target',
      icon: <HeartFilled />,
      label: '目标院校',
      path: '/target'
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: '统计',
      path: '/stats'
    },
    {
      key: 'recommend',
      icon: <StarOutlined />,
      label: '志愿推荐',
      path: '/recommend'
    },
    {
      key: 'compare',
      icon: <SwapOutlined />,
      label: '多年对比',
      path: '/compare'
    },
    {
      key: 'ai',
      icon: <RobotOutlined />,
      label: 'AI助手',
      path: '/ai'
    },
    {
      key: 'universities',
      icon: <UnorderedListOutlined />,
      label: '高校大全',
      path: '/universities'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key);
    const item = menuItems.find(item => item.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/search')}>
          高考志愿填报查询系统
        </div>
        {isAuthenticated && (
          <Button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'transparent', color: 'white' }}>
            退出登录
          </Button>
        )}
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
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
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/search" replace />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              <Route path="/target" element={
                <ProtectedRoute>
                  <TargetUniversitiesPage />
                </ProtectedRoute>
              } />
              <Route path="/stats" element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              } />
              <Route path="/recommend" element={
                <ProtectedRoute>
                  <RecommendPage />
                </ProtectedRoute>
              } />
              <Route path="/compare" element={
                <ProtectedRoute>
                  <ComparePage />
                </ProtectedRoute>
              } />
              <Route path="/ai" element={
                <ProtectedRoute>
                  <AIAssistantPage />
                </ProtectedRoute>
              } />
              <Route path="/universities" element={
                <ProtectedRoute>
                  <UniversityListPage />
                </ProtectedRoute>
              } />
              <Route path="/university/:name" element={
                <ProtectedRoute>
                  <UniversityDetailPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
