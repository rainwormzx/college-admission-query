import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  message,
  Typography,
  Tag,
  Divider,
  Spin
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ClearOutlined
} from '@ant-design/icons';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './AIAssistantPage.css';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `你好！我是高考志愿填报智能助手，可以为你提供以下帮助：

📊 **分数分析**：根据你的分数分析可以报考的院校层次
🏫 **院校推荐**：根据分数、地区偏好推荐合适的院校
📚 **专业选择**：根据兴趣、性格推荐适合的专业
💼 **就业前景**：分析专业和院校的就业情况
📈 **院校对比**：对比不同院校的优劣势
📝 **填报策略**：提供志愿填报的具体策略建议

请告诉我你的高考分数、所在省份等信息，我会为你提供更精准的建议！`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | undefined>();
  const [province, setProvince] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage) {
      message.warning('请输入问题');
      return;
    }

    // 添加用户消息
    const newMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        messages: [...messages, newMessage].map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        score,
        province
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI请求失败:', error);
      message.error('AI助手暂时不可用，请稍后再试');
      // 移除用户消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: '对话已清空。请问有什么可以帮助你的？',
        timestamp: new Date()
      }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 头部信息 */}
          <div>
            <Title level={3}>
              <RobotOutlined style={{ marginRight: 8 }} />
              高考志愿填报智能助手
            </Title>
            <Paragraph type="secondary">
              基于大数据和AI技术，为你提供专业的志愿填报建议
            </Paragraph>
          </div>

          {/* 用户信息输入 */}
          <Card size="small" title="你的信息（可选，填写后可获得更精准的建议）">
            <Space wrap>
              <Space>
                <Text strong>高考分数：</Text>
                <Input
                  placeholder="例如：600"
                  style={{ width: 120 }}
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value ? Number(e.target.value) : undefined)}
                />
              </Space>
              <Space>
                <Text strong>所在省份：</Text>
                <Input
                  placeholder="例如：广东"
                  style={{ width: 150 }}
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </Space>
            </Space>
          </Card>

          {/* 聊天区域 */}
          <Card
            style={{ height: 500, overflow: 'auto' }}
            bodyStyle={{ height: '100%', overflow: 'auto', padding: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    className={`message-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <div className="message-header">
                      {msg.role === 'user' ? (
                        <UserOutlined style={{ marginRight: 6 }} />
                      ) : (
                        <RobotOutlined style={{ marginRight: 6 }} />
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {msg.timestamp.toLocaleTimeString()}
                      </Text>
                    </div>
                    <div className="message-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div className="message-bubble assistant">
                    <Spin tip="AI正在思考中..." />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </Space>
          </Card>

          {/* 输入区域 */}
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              placeholder="请输入你的问题，例如：我考了600分，想学计算机专业，有哪些学校推荐？"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              autoSize={{ minRows: 2, maxRows: 6 }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              style={{ height: 'auto' }}
            >
              发送
            </Button>
          </Space.Compact>

          {/* 快捷问题 */}
          <Divider>快捷问题</Divider>
          <Space wrap>
            <Tag
              color="blue"
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => setInput('我的分数能上什么层次的大学？')}
            >
              我的分数能上什么层次的大学？
            </Tag>
            <Tag
              color="green"
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => setInput('计算机专业哪个学校最好？就业前景如何？')}
            >
              计算机专业哪个学校最好？
            </Tag>
            <Tag
              color="orange"
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => setInput('985和211有什么区别？')}
            >
              985和211有什么区别？
            </Tag>
            <Tag
              color="purple"
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => setInput('志愿填报应该注意什么？')}
            >
              志愿填报应该注意什么？
            </Tag>
            <Tag
              color="red"
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => setInput('专业和学校哪个更重要？')}
            >
              专业和学校哪个更重要？
            </Tag>
          </Space>

          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空对话
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AIAssistantPage;
