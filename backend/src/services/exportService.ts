import ExcelJS from 'exceljs';
import type { SearchParams } from '../types';
import { searchAdmission } from './searchService';

export const exportToExcel = async (params: SearchParams) => {
  // 查询数据（不分页，获取所有结果）
  const result = await searchAdmission({
    ...params,
    page: 1,
    pageSize: 100000
  });

  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('查询结果');

  // 定义列
  worksheet.columns = [
    { header: '年份', key: 'year', width: 10 },
    { header: '院校名称', key: 'universityName', width: 30 },
    { header: '院校代码', key: 'universityCode', width: 15 },
    { header: '科类', key: 'category', width: 10 },
    { header: '批次', key: 'batch', width: 15 },
    { header: '选科要求', key: 'subjectRequirement', width: 15 },
    { header: '专业', key: 'major', width: 30 },
    { header: '专业代码', key: 'majorCode', width: 15 },
    { header: '所属专业组', key: 'majorGroup', width: 15 },
    { header: '专业备注', key: 'majorNote', width: 20 },
    { header: '录取人数', key: 'admissionCount', width: 12 },
    { header: '最低分数', key: 'minScore', width: 12 },
    { header: '最低位次', key: 'minRank', width: 12 },
    { header: '学校所在', key: 'schoolLocation', width: 12 },
    { header: '学校性质', key: 'schoolNature', width: 12 },
    { header: '是否985', key: 'is985', width: 10 },
    { header: '是否211', key: 'is211', width: 10 }
  ];

  // 添加数据
  result.data.forEach((item) => {
    worksheet.addRow({
      year: item.year,
      universityName: item.universityName,
      universityCode: item.universityCode,
      category: item.category,
      batch: item.batch,
      subjectRequirement: item.subjectRequirement,
      major: item.major,
      majorCode: item.majorCode,
      majorGroup: item.majorGroup || '',
      majorNote: item.majorNote || '',
      admissionCount: item.admissionCount || '',
      minScore: item.minScore || '',
      minRank: item.minRank || '',
      schoolLocation: item.schoolLocation,
      schoolNature: item.schoolNature,
      is985: item.is985 ? '是' : '否',
      is211: item.is211 ? '是' : '否'
    });
  });

  // 设置表头样式
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // 生成Buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
};
