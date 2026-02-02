"""
从Excel文件更新专业备注字段到数据库
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv('../backend/.env')

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'admission_query',
    'user': 'postgres',
    'password': 'rainworm'
}

EXCEL_FILE = '../22-25年全国高校在浙江的专业录取分数.xlsx'

print("=== 从Excel更新专业备注到数据库 ===\n")

# 读取Excel文件
print("步骤1: 读取Excel文件...")
df = pd.read_excel(EXCEL_FILE)
print(f"✅ 读取到 {len(df)} 行数据\n")

# 重命名列
column_mapping = {
    '年份': 'year',
    '院校名称': 'university_name',
    '专业': 'major',
    '专业备注': 'major_note'
}
df = df.rename(columns=column_mapping)

# 清洗数据
df['major_note'] = df['major_note'].apply(lambda x: x.strip() if pd.notna(x) and isinstance(x, str) else None)

# 只保留有专业备注的记录
df_with_notes = df[df['major_note'].notna()].copy()
print(f"步骤2: 找到 {len(df_with_notes)} 条有专业备注的记录\n")

# 连接数据库
print("步骤3: 连接数据库...")
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

# 显示一些示例
print("专业备注示例（前10条）:")
for idx, row in df_with_notes.head(10).iterrows():
    print(f"  {row['year']}年 {row['university_name']} - {row['major']}")
    print(f"    备注: {row['major_note']}")
print()

# 更新数据库
print("步骤4: 更新数据库...")
updated_count = 0
batch_updates = []

for idx, row in df_with_notes.iterrows():
    batch_updates.append((
        row['major_note'],
        row['year'],
        row['university_name'],
        row['major']
    ))

# 批量更新
update_sql = """
    UPDATE admission_data
    SET major_note = %s
    WHERE year = %s
      AND university_name = %s
      AND major = %s
"""

try:
    execute_batch(cursor, update_sql, batch_updates, page_size=1000)
    conn.commit()
    updated_count = len(batch_updates)
    print(f"✅ 成功更新 {updated_count} 条记录\n")
except Exception as e:
    print(f"❌ 更新失败: {e}")
    conn.rollback()
    cursor.close()
    conn.close()
    sys.exit(1)

# 验证更新结果
print("步骤5: 验证更新结果...")
cursor.execute("""
    SELECT COUNT(*)
    FROM admission_data
    WHERE major_note IS NOT NULL AND major_note != ''
""")
count = cursor.fetchone()[0]
print(f"✅ 数据库中现有 {count} 条有专业备注的记录\n")

# 显示一些更新后的示例
print("浙江大学2025年专业备注示例:")
cursor.execute("""
    SELECT major, major_note
    FROM admission_data
    WHERE year = 2025
      AND university_name = '浙江大学'
      AND major_note IS NOT NULL
      AND major_note != ''
    LIMIT 10
""")
for major, note in cursor.fetchall():
    print(f"  {major}:")
    print(f"    {note}")
print()

cursor.close()
conn.close()

print("✅ 专业备注更新完成！")
