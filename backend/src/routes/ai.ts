import { Router } from 'express';
import { getAIResponse } from '../services/aiService';

const router = Router();

// AI聊天接口
router.post('/chat', async (req, res) => {
  try {
    const { messages, score, rank, province, category } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '消息格式错误' });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.content || lastMessage.content.trim() === '') {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    const response = await getAIResponse({
      messages,
      score,
      rank,
      province,
      category
    });

    res.json({ response });
  } catch (error) {
    console.error('AI聊天错误:', error);
    res.status(500).json({ error: 'AI服务暂时不可用' });
  }
});

export default router;
