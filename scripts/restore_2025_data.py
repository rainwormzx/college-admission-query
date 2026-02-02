"""
恢复2025年490分数据到修改前的状态
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
import os
import sys
import numpy as np

# 设置UTF-8输出编码
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
    'user': 'postgres',
    'password': 'rainworm'
}

# Excel文件路径
EXCEL_FILE = '../22-25年全国高校在浙江的专业录取分数.xlsx'


def restore_2025_data():
    """从Excel文件重新导入2025年数据"""

    print("=== 开始恢复2025年数据 ===\n")

    # 读取Excel文件
    print("步骤1: 读取Excel文件...")
    df = pd.read_excel(EXCEL_FILE)
    df_2025 = df[df['年份'] == 2025].copy()
    print(f"✅ 找到 {len(df_2025)} 行2025年数据\n")

    # 数据清洗
    print("步骤2: 清洗数据...")

    # 重命名列
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

    df_2025 = df_2025.rename(columns=column_mapping)

    # 清洗数据
    df_2025['year'] = df_2025['year'].astype(int)
    df_2025['university_name'] = df_2025['university_name'].fillna('').astype(str)
    df_2025['university_code'] = df_2025['university_code'].fillna('').astype(str)
    df_2025['category'] = df_2025['category'].fillna('').astype(str)
    df_2025['batch'] = df_2025['batch'].fillna('').astype(str)
    df_2025['subject_requirement'] = df_2025['subject_requirement'].fillna('').astype(str)
    df_2025['major'] = df_2025['major'].fillna('').astype(str)
    df_2025['major_code'] = df_2025['major_code'].fillna('').astype(str)
    df_2025['school_location'] = df_2025['school_location'].fillna('').astype(str)
    df_2025['school_nature'] = df_2025['school_nature'].fillna('').astype(str)

    def clean_boolean(value):
        if pd.isna(value):
            return False
        if isinstance(value, str):
            return value.strip() == '是'
        return bool(value)

    df_2025['is_985'] = df_2025['is_985'].apply(clean_boolean)
    df_2025['is_211'] = df_2025['is_211'].apply(clean_boolean)

    # 处理可为空的字段
    for col in ['major_group', 'major_note', 'admission_count', 'min_score', 'min_rank']:
        if col in df_2025.columns:
            if col in ['admission_count', 'min_rank']:
                # 转换为字符串
                df_2025[col] = df_2025[col].apply(lambda x: str(int(x)) if pd.notna(x) and isinstance(x, (int, float)) and np.isfinite(x) else None)
            else:
                df_2025[col] = df_2025[col].apply(lambda x: int(x) if pd.notna(x) and isinstance(x, (int, float)) and np.isfinite(x) else None)

    print(f"✅ 数据清洗完成，有效数据 {len(df_2025)} 行\n")

    # 连接数据库
    print("步骤3: 连接数据库并恢复数据...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # 先删除2025年的所有数据
        print("  删除2025年的旧数据...")
        cursor.execute("DELETE FROM admission_data WHERE year = 2025")
        deleted_count = cursor.rowcount
        print(f"  ✅ 删除了 {deleted_count} 条记录\n")

        # 插入2025年数据
        print("  重新插入2025年数据...")

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
        for _, row in df_2025.iterrows():
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

        execute_batch(cursor, insert_sql, data_to_insert, page_size=1000)
        conn.commit()

        print(f"  ✅ 成功插入 {len(data_to_insert)} 条记录")

        # 验证恢复结果
        cursor.execute("SELECT COUNT(*) FROM admission_data WHERE year = 2025")
        count = cursor.fetchone()[0]
        print(f"\n📊 数据库中2025年现有 {count} 条记录")

        # 验证490分的数量
        cursor.execute("SELECT COUNT(*) FROM admission_data WHERE year = 2025 AND min_score = '490'")
        score_490_count = cursor.fetchone()[0]
        print(f"📊 2025年490分的专业数量: {score_490_count}")

        print("\n✅ 数据恢复完成！")

    except Exception as e:
        print(f"❌ 错误: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    restore_2025_data()
