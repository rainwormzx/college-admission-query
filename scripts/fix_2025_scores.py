"""
修复2025年490分预估数据
用2024年实际录取分数替换2025年490分的预估数据
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


def fix_2025_scores():
    """修复2025年490分数据"""

    print("=== 开始修复2025年490分预估数据 ===\n")

    # 连接数据库
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # 1. 查询2025年490分的专业
        print("步骤1: 查询2025年490分的专业...")
        cursor.execute("""
            SELECT university_name, major, university_code, major_code,
                   category, batch, subject_requirement, school_location,
                   school_nature, is_985, is_211
            FROM admission_data
            WHERE year = 2025 AND min_score = 490
        """)

        score_490_records = cursor.fetchall()
        print(f"  找到 {len(score_490_records)} 个490分专业\n")

        if len(score_490_records) == 0:
            print("没有需要修复的数据！")
            return

        # 2. 查询2024年对应专业的实际录取分数
        print("步骤2: 查询2024年对应专业的实际录取分数...")

        updated_count = 0
        not_found_count = 0

        for record in score_490_records:
            (university_name, major, univ_code, major_code, category, batch,
             subject_req, location, nature, is_985, is_211) = record

            # 构建查询条件：优先用专业代码匹配，其次用专业名称+院校名称匹配
            if major_code and pd.notna(major_code) and str(major_code).strip():
                # 使用专业代码匹配
                cursor.execute("""
                    SELECT min_score, min_rank
                    FROM admission_data
                    WHERE year = 2024
                      AND major_code = %s
                      AND min_score IS NOT NULL
                      AND min_score != 490
                    ORDER BY min_score DESC
                    LIMIT 1
                """, (str(major_code).strip(),))
            else:
                # 使用专业名称+院校名称匹配
                cursor.execute("""
                    SELECT min_score, min_rank
                    FROM admission_data
                    WHERE year = 2024
                      AND university_name = %s
                      AND major = %s
                      AND min_score IS NOT NULL
                      AND min_score != 490
                    LIMIT 1
                """, (university_name, major))

            result = cursor.fetchone()

            if result:
                score_2024, rank_2024 = result

                # 更新2025年的分数和位次
                cursor.execute("""
                    UPDATE admission_data
                    SET min_score = %s,
                        min_rank = %s
                    WHERE year = 2025
                      AND university_name = %s
                      AND major = %s
                      AND min_score = 490
                """, (score_2024,
                       str(int(rank_2024)) if pd.notna(rank_2024) else None,
                       university_name,
                       major))

                updated_count += 1

                if updated_count <= 10:
                    print(f"  ✓ {university_name} - {major}: 490分 → {score_2024}分")
            else:
                not_found_count += 1
                if not_found_count <= 10:
                    print(f"  ✗ {university_name} - {major}: 未找到2024年数据")

        # 提交事务
        conn.commit()

        print(f"\n步骤3: 更新完成！")
        print(f"  成功更新: {updated_count} 个专业")
        print(f"  未找到2024年数据: {not_found_count} 个专业")

        # 4. 验证修复结果
        print("\n步骤4: 验证修复结果...")
        cursor.execute("""
            SELECT min_score, COUNT(*) as count
            FROM admission_data
            WHERE year = 2025 AND min_score IS NOT NULL
            GROUP BY min_score
            ORDER BY count DESC
            LIMIT 10
        """)

        print("\n2025年修复后的分数分布（Top 10）:")
        for row in cursor.fetchall():
            score, count = row
            print(f"  {score}分: {count}个专业")

    except Exception as e:
        print(f"❌ 错误: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

    print("\n✅ 修复完成！")


if __name__ == '__main__':
    fix_2025_scores()
