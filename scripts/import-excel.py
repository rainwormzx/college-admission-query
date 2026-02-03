#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel数据导入脚本
将 22-25年全国高校在浙江的专业录取分数.xlsx 导入到PostgreSQL数据库
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
import os
import sys
import numpy as np

# 设置UTF-8输出编码（解决Windows GBK编码问题）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 加载环境变量
load_dotenv('../backend/.env')

# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'admission_query',
    'user': 'rainworm',
    'password': 'Admission2024!'
}

# Excel文件路径
EXCEL_FILE = '../22-25scoredata.xlsx'


def clean_value(value):
    """清理数据值"""
    if pd.isna(value):
        return None
    if isinstance(value, float):
        # 检查是否为NaN或无穷大
        if not np.isfinite(value):
            return None
        # 转换为int
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    return value


def clean_boolean(value):
    """清理布尔值"""
    if pd.isna(value):
        return False
    if isinstance(value, str):
        return value.strip() == '是'
    return bool(value)


def import_excel_to_db():
    """导入Excel数据到数据库"""

    print(f"正在读取Excel文件: {EXCEL_FILE}")
    try:
        df = pd.read_excel(EXCEL_FILE)
        print(f"✅ 成功读取 {len(df)} 行数据")
    except Exception as e:
        print(f"❌ 读取Excel文件失败: {e}")
        sys.exit(1)

    # 显示列名
    print("\n数据列:")
    print(df.columns.tolist())

    # 数据清洗
    print("\n正在清洗数据...")

    # 重命名列（中文转英文下划线）
    column_mapping = {
        '年份': 'year',
        '院校名称': 'university_name',
        '院校代码': 'university_code',
        '科类': 'category',
        '批次': 'batch',
        '选科要求': 'subject_requirement',
        '专业': 'major',
        '专业代码': 'major_code',
        '所属专业组': 'major_group',
        '专业备注': 'major_note',
        '录取人数': 'admission_count',
        '最低分数': 'min_score',
        '最低位次': 'min_rank',
        '学校所在': 'school_location',
        '学校性质': 'school_nature',
        '是否985': 'is_985',
        '是否211': 'is_211'
    }

    df = df.rename(columns=column_mapping)

    # 清洗数据
    df['year'] = df['year'].astype(int)
    df['university_name'] = df['university_name'].fillna('').astype(str)
    df['university_code'] = df['university_code'].fillna('').astype(str)
    df['category'] = df['category'].fillna('').astype(str)
    df['batch'] = df['batch'].fillna('').astype(str)
    df['subject_requirement'] = df['subject_requirement'].fillna('').astype(str)
    df['major'] = df['major'].fillna('').astype(str)
    df['major_code'] = df['major_code'].fillna('').astype(str)
    df['school_location'] = df['school_location'].fillna('').astype(str)
    df['school_nature'] = df['school_nature'].fillna('').astype(str)
    df['is_985'] = df['is_985'].apply(clean_boolean)
    df['is_211'] = df['is_211'].apply(clean_boolean)

    # 处理可为空的字段
    for col in ['major_group', 'major_note', 'admission_count', 'min_score', 'min_rank']:
        if col in df.columns:
            if col in ['admission_count', 'min_rank']:
                # 转换为字符串
                df[col] = df[col].apply(lambda x: str(int(x)) if pd.notna(x) and isinstance(x, (int, float)) and np.isfinite(x) else None)
            else:
                df[col] = df[col].apply(clean_value)

    print(f"✅ 数据清洗完成，有效数据 {len(df)} 行")

    # 连接数据库
    print("\n正在连接数据库...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ 数据库连接成功")
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        print("\n请确保:")
        print("1. PostgreSQL已安装并运行")
        print("2. 数据库已创建")
        sys.exit(1)

    # 创建表（如果不存在）
    print("\n正在创建表...")
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS admission_data (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        university_name VARCHAR(200),
        university_code VARCHAR(20),
        category VARCHAR(50),
        batch VARCHAR(50),
        subject_requirement VARCHAR(100),
        major VARCHAR(200),
        major_code VARCHAR(50),
        major_group VARCHAR(100),
        major_note TEXT,
        admission_count INTEGER,
        min_score INTEGER,
        min_rank INTEGER,
        school_location VARCHAR(100),
        school_nature VARCHAR(50),
        is_985 BOOLEAN DEFAULT FALSE,
        is_211 BOOLEAN DEFAULT FALSE
    );

    -- 创建索引
    DROP INDEX IF EXISTS idx_year;
    DROP INDEX IF EXISTS idx_major;
    DROP INDEX IF EXISTS idx_school_location;
    DROP INDEX IF EXISTS idx_min_score;
    DROP INDEX IF EXISTS idx_min_rank;
    DROP INDEX IF EXISTS idx_university_name;

    CREATE INDEX idx_year ON admission_data(year);
    CREATE INDEX idx_major ON admission_data(major);
    CREATE INDEX idx_school_location ON admission_data(school_location);
    CREATE INDEX idx_min_score ON admission_data(min_score);
    CREATE INDEX idx_min_rank ON admission_data(min_rank);
    CREATE INDEX idx_university_name ON admission_data(university_name);
    """

    try:
        cursor.execute(create_table_sql)
        conn.commit()
        print("✅ 表创建成功")
    except Exception as e:
        print(f"❌ 表创建失败: {e}")
        conn.close()
        sys.exit(1)

    # 清空旧数据（可选）
    print("\n是否清空旧数据？(y/n): ", end='')
    try:
        choice = input().lower()
        if choice == 'y':
            cursor.execute("DELETE FROM admission_data")
            conn.commit()
            print("✅ 旧数据已清空")
    except:
        print("\n将直接追加数据...")

    # 插入数据
    print(f"\n正在插入数据（共 {len(df)} 行）...")

    insert_sql = """
    INSERT INTO admission_data (
        year, university_name, university_code, category, batch,
        subject_requirement, major, major_code, major_group, major_note,
        admission_count, min_score, min_rank, school_location,
        school_nature, is_985, is_211
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
    )
    """

    data_to_insert = []
    for _, row in df.iterrows():
        data_to_insert.append((
            row['year'],
            row['university_name'],
            row['university_code'],
            row['category'],
            row['batch'],
            row['subject_requirement'],
            row['major'],
            row['major_code'],
            row['major_group'],
            row['major_note'],
            row['admission_count'],
            row['min_score'],
            row['min_rank'],
            row['school_location'],
            row['school_nature'],
            row['is_985'],
            row['is_211']
        ))

    try:
        execute_batch(cursor, insert_sql, data_to_insert, page_size=1000)
        conn.commit()
        print("✅ 数据插入成功")

        # 验证数据
        cursor.execute("SELECT COUNT(*) FROM admission_data")
        count = cursor.fetchone()[0]
        print(f"\n📊 数据库中现有 {count} 条记录")

    except Exception as e:
        print(f"❌ 数据插入失败: {e}")
        conn.rollback()
        conn.close()
        sys.exit(1)

    # 关闭连接
    cursor.close()
    conn.close()

    print("\n✅ 数据导入完成！")


if __name__ == '__main__':
    import_excel_to_db()
