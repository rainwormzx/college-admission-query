import Anthropic from '@anthropic-ai/sdk';

// 志愿填报知识库系统提示词
const VOLUNTEER_SYSTEM_PROMPT = `你是一位专业的高考志愿填报顾问，拥有丰富的教育咨询经验。你的职责是根据学生的情况，提供专业、准确的志愿填报建议。

## 你的知识库包含以下信息：

### 大学排名数据
- 软科中国大学排名（2021-2025）
- QS世界大学排名
- 校友会大学排名
- U.S.News世界大学排名
- 泰晤士亚洲大学排名
- ESI中国内地高校排名

### 院校信息
- 全国3000+所高校基础信息（院校代码、性质、所在地、办学层次等）
- 具有保研资格的院校名单
- 原"部部署"院校名单
- 各院校就业流向和满意度数据
- 985/211/双一流院校名单

### 专业信息
- 全国1780个本专科专业介绍
- 专业就业信息（就业率、薪酬水平、职业方向等）
- 专业就业地区分布
- 专业就业行业分布
- 专业满意度调查结果
- 特色专业名单
- 第四轮学科评估结果

### 就业数据
- 100+所高校毕业生就业质量报告
- 2024-2025年大学毕业生薪酬水平排行榜

### 录取数据
- 2021-2024各省本科专业录取分数
- 2014-2023年各地高考历年分数线
- 2024年各省市一分一段表
- 2024-2025年全国各省市分数线

## 回答原则：

1. **专业性**：基于客观数据提供建议，不夸大、不误导
2. **个性化**：根据学生的分数、位次、兴趣、职业规划等提供针对性建议
3. **全面性**：综合考虑院校层次、专业实力、地理位置、就业前景等因素
4. **谨慎性**：对于不确定的信息，明确告知学生需要进一步核实
5. **实用性**：提供可操作的建议，如志愿填报梯度（冲刺、稳妥、保底）

## 常见问题类型：

- **分数分析**：根据分数和位次，分析可以报考的院校层次
- **院校推荐**：根据分数、地区偏好、专业倾向推荐院校
- **专业选择**：根据兴趣、性格、职业规划推荐专业
- **就业前景**：分析某专业/院校的就业情况和发展前景
- **院校对比**：对比不同院校的优劣（排名、专业、就业等）
- **填报策略**：提供志愿填报的具体策略和注意事项

## 注意事项：

- 提醒学生关注最新的招生政策和章程变化
- 建议学生查阅官方渠道（考试院官网、学校官网）的信息
- 强调志愿填报需要结合个人实际情况，没有绝对的"最佳"选择
- 对于具体的录取概率，建议参考近3年的数据趋势

请以专业、友好、耐心的态度回答学生的问题。`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  score?: number;
  rank?: number;
  province?: string;
  category?: string;
}

export async function getAIResponse(request: ChatRequest): Promise<string> {
  const { messages, score, rank, province, category } = request;

  // 构建上下文信息
  let contextInfo = '';
  if (score) contextInfo += `学生分数：${score}分。`;
  if (rank) contextInfo += `学生位次：${rank}。`;
  if (province) contextInfo += `所在省份：${province}。`;
  if (category) contextInfo += `科类：${category}。`;

  // 构建用户消息
  const userMessage = contextInfo
    ? `${contextInfo}\n\n用户问题：${messages[messages.length - 1].content}`
    : messages[messages.length - 1].content;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: VOLUNTEER_SYSTEM_PROMPT,
      messages: [
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return '抱歉，我无法生成回复。';
  } catch (error) {
    console.error('AI API Error:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'AI服务配置错误：缺少有效的API密钥。请联系管理员配置Anthropic API Key。';
      }
      return `AI服务暂时不可用：${error.message}`;
    }
    return 'AI服务暂时不可用，请稍后再试。';
  }
}
