import React, { useState } from 'react';
import { Card, Form, Input, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      return;
    }

    setLoading(true);
    try {
      await login(password);
      // 登录成功后跳转到查询页面
      navigate('/search', { replace: true });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="高考志愿填报查询系统" bordered={false}>
        <form onSubmit={handleSubmit}>
          <Form.Item>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入访问密码"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
