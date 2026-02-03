import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type {
  TargetUniversity,
  TargetUniversitiesContextType,
  AdmissionData
} from '../types';

const TargetUniversitiesContext = createContext<TargetUniversitiesContextType | undefined>(undefined);

const STORAGE_KEY = 'targetUniversities';

// 从 localStorage 加载数据
const loadFromLocalStorage = (): TargetUniversity[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('从 localStorage 加载失败', error);
    return [];
  }
};

// 保存到 localStorage
const saveToLocalStorage = (data: TargetUniversity[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存到 localStorage 失败', error);
    message.error('保存失败，存储空间不足');
  }
};

export const TargetUniversitiesProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [targetUniversities, setTargetUniversities] = useState<TargetUniversity[]>([]);

  // 初始化时从 localStorage 加载
  useEffect(() => {
    const loaded = loadFromLocalStorage();
    setTargetUniversities(loaded);
  }, []);

  // 添加目标院校
  const addTargetUniversity = useCallback((record: AdmissionData) => {
    const exists = targetUniversities.some(t => t.id === record.id);
    if (exists) {
      message.warning('该记录已在目标院校列表中');
      return;
    }

    const maxOrder = targetUniversities.length > 0
      ? Math.max(...targetUniversities.map(t => t.order))
      : -1;

    const newTarget: TargetUniversity = {
      ...record,
      order: maxOrder + 1,
      addedAt: new Date().toISOString()
    };

    const updated = [...targetUniversities, newTarget];
    setTargetUniversities(updated);
    saveToLocalStorage(updated);
    message.success('已添加到目标院校');
  }, [targetUniversities]);

  // 批量添加目标院校
  const batchAddTargetUniversities = useCallback((records: AdmissionData[]) => {
    const maxOrder = targetUniversities.length > 0
      ? Math.max(...targetUniversities.map(t => t.order))
      : -1;

    const newRecords: TargetUniversity[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    records.forEach((record, index) => {
      const exists = targetUniversities.some(t => t.id === record.id);
      if (exists) {
        skippedCount++;
        return;
      }
      addedCount++;

      newRecords.push({
        ...record,
        order: maxOrder + 1 + index,
        addedAt: new Date().toISOString()
      });
    });

    if (newRecords.length > 0) {
      const updated = [...targetUniversities, ...newRecords];
      setTargetUniversities(updated);
      saveToLocalStorage(updated);
    }

    return { addedCount, skippedCount };
  }, [targetUniversities]);

  // 删除目标院校
  const removeTargetUniversity = useCallback((id: number) => {
    const updated = targetUniversities.filter(t => t.id !== id);
    setTargetUniversities(updated);
    saveToLocalStorage(updated);
    message.success('已从目标院校移除');
  }, [targetUniversities]);

  // 检查是否已保存
  const isTargetUniversity = useCallback((id: number) => {
    return targetUniversities.some(t => t.id === id);
  }, [targetUniversities]);

  // 上移
  const moveUp = useCallback((id: number) => {
    const index = targetUniversities.findIndex(t => t.id === id);
    if (index <= 0) return;

    const updated = [...targetUniversities];
    [updated[index].order, updated[index - 1].order] =
      [updated[index - 1].order, updated[index].order];

    updated.sort((a, b) => a.order - b.order);
    setTargetUniversities(updated);
    saveToLocalStorage(updated);
  }, [targetUniversities]);

  // 下移
  const moveDown = useCallback((id: number) => {
    const index = targetUniversities.findIndex(t => t.id === id);
    if (index === -1 || index === targetUniversities.length - 1) return;

    const updated = [...targetUniversities];
    [updated[index].order, updated[index + 1].order] =
      [updated[index + 1].order, updated[index].order];

    updated.sort((a, b) => a.order - b.order);
    setTargetUniversities(updated);
    saveToLocalStorage(updated);
  }, [targetUniversities]);

  // 移至顶部
  const moveToTop = useCallback((id: number) => {
    const index = targetUniversities.findIndex(t => t.id === id);
    if (index <= 0) return;

    const updated = targetUniversities.map((t, i) => {
      if (i < index) {
        return { ...t, order: t.order + 1 };
      } else if (i === index) {
        return { ...t, order: 0 };
      }
      return t;
    });

    updated.sort((a, b) => a.order - b.order);
    setTargetUniversities(updated);
    saveToLocalStorage(updated);
  }, [targetUniversities]);

  // 移至底部
  const moveToBottom = useCallback((id: number) => {
    const index = targetUniversities.findIndex(t => t.id === id);
    if (index === -1 || index === targetUniversities.length - 1) return;

    const maxOrder = Math.max(...targetUniversities.map(t => t.order));
    const updated = targetUniversities.map(t =>
      t.id === id ? { ...t, order: maxOrder + 1 } : t
    );

    updated.sort((a, b) => a.order - b.order);
    setTargetUniversities(updated);
    saveToLocalStorage(updated);
  }, [targetUniversities]);

  // 清空所有
  const clearAll = useCallback(() => {
    setTargetUniversities([]);
    saveToLocalStorage([]);
    message.success('已清空所有目标院校');
  }, []);

  // 导出为 Excel
  const exportToExcel = useCallback(async () => {
    try {
      if (targetUniversities.length === 0) {
        message.warning('暂无数据可导出');
        return;
      }

      // 动态导入 xlsx 库
      const XLSX = await import('xlsx');

      // 准备导出数据
      const exportData = targetUniversities.map((item, index) => ({
        '序号': index + 1,
        '年份': item.year,
        '院校名称': item.universityName,
        '院校代码': item.universityCode,
        '专业': item.major,
        '专业代码': item.majorCode,
        '学科门类': item.subjectCategory || '-',
        '科类': item.category,
        '批次': item.batch,
        '选科要求': item.subjectRequirement,
        '最低分数': item.minScore || '-',
        '最低位次': item.minRank || '-',
        '学校所在': item.schoolLocation,
        '办学性质': item.schoolNature,
        '985工程': item.is985 ? '是' : '否',
        '211工程': item.is211 ? '是' : '否',
        '专业备注': item.majorNote || '-'
      }));

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      worksheet['!cols'] = [
        { wch: 6 },   // 序号
        { wch: 8 },   // 年份
        { wch: 30 },  // 院校名称
        { wch: 12 },  // 院校代码
        { wch: 25 },  // 专业
        { wch: 12 },  // 专业代码
        { wch: 12 },  // 学科门类
        { wch: 8 },   // 科类
        { wch: 15 },  // 批次
        { wch: 15 },  // 选科要求
        { wch: 10 },  // 最低分数
        { wch: 10 },  // 最低位次
        { wch: 12 },  // 学校所在
        { wch: 12 },  // 办学性质
        { wch: 10 },  // 985工程
        { wch: 10 },  // 211工程
        { wch: 30 }   // 专业备注
      ];

      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '目标院校');

      // 生成文件名
      const fileName = `目标院校_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;

      // 导出下载
      XLSX.writeFile(workbook, fileName);
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败', error);
      message.error('导出失败，请重试');
    }
  }, [targetUniversities]);

  const value: TargetUniversitiesContextType = {
    targetUniversities,
    addTargetUniversity,
    batchAddTargetUniversities,
    removeTargetUniversity,
    isTargetUniversity,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    clearAll,
    exportToExcel
  };

  return (
    <TargetUniversitiesContext.Provider value={value}>
      {children}
    </TargetUniversitiesContext.Provider>
  );
};

export const useTargetUniversities = (): TargetUniversitiesContextType => {
  const context = useContext(TargetUniversitiesContext);
  if (context === undefined) {
    throw new Error('useTargetUniversities must be used within a TargetUniversitiesProvider');
  }
  return context;
};
