import { Router } from 'express';
import { searchAdmission } from '../services/searchService';
import { getStats } from '../services/statsService';
import { getRecommend } from '../services/recommendService';
import { exportToExcel } from '../services/exportService';
import { getCompare } from '../services/compareService';
import { getScoreRankMapping } from '../services/scoreRankService';
import prisma from '../utils/database';

const router = Router();

// 查询接口
router.post('/search', async (req, res) => {
  try {
    const result = await searchAdmission(req.body);
    res.json(result);
  } catch (error) {
    console.error('查询错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 导出接口
router.post('/export', async (req, res) => {
  try {
    const buffer = await exportToExcel(req.body);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=query_result_${Date.now()}.xlsx`
    );
    res.send(buffer);
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 统计接口
router.get('/stats', async (req, res) => {
  try {
    const { year, major, schoolLocation } = req.query;
    const result = await getStats(
      year ? Number(year) : undefined,
      major as string,
      schoolLocation as string
    );
    res.json(result);
  } catch (error) {
    console.error('统计错误:', error);
    res.status(500).json({ error: '统计失败' });
  }
});

// 推荐接口
router.post('/recommend', async (req, res) => {
  try {
    const result = await getRecommend(req.body);
    res.json(result);
  } catch (error) {
    console.error('推荐错误:', error);
    res.status(500).json({ error: '推荐失败' });
  }
});

// 对比接口
router.post('/compare', async (req, res) => {
  try {
    const result = await getCompare(req.body);
    res.json(result);
  } catch (error) {
    console.error('对比错误:', error);
    res.status(500).json({ error: '对比失败' });
  }
});

// 获取所有年份
router.get('/years', async (req, res) => {
  try {
    const years = await prisma.admissionData.findMany({
      select: {
        year: true
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc'
      }
    });
    res.json(years.map((y) => y.year));
  } catch (error) {
    console.error('获取年份错误:', error);
    res.status(500).json({ error: '获取年份失败' });
  }
});

// 获取所有地区
router.get('/locations', async (req, res) => {
  try {
    const locations = await prisma.admissionData.findMany({
      select: {
        schoolLocation: true
      },
      distinct: ['schoolLocation'],
      orderBy: {
        schoolLocation: 'asc'
      }
    });
    res.json(locations.map((l) => l.schoolLocation));
  } catch (error) {
    console.error('获取地区错误:', error);
    res.status(500).json({ error: '获取地区失败' });
  }
});

// 分数位次映射接口
router.get('/score-rank-mapping', async (req, res) => {
  try {
    const { year, score, rank } = req.query;
    if (!year) {
      return res.status(400).json({ error: '年份参数必填' });
    }

    const result = await getScoreRankMapping(
      Number(year),
      score !== undefined ? Number(score) : undefined,
      rank !== undefined ? Number(rank) : undefined
    );
    res.json(result);
  } catch (error) {
    console.error('分数位次映射错误:', error);
    res.status(500).json({ error: '分数位次映射失败' });
  }
});

export default router;
