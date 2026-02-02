"""
查询所有年份浙江大学人文科学试验班的专业备注
"""
import psycopg2
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

conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

print("=== 查询所有年份浙江大学人文科学试验班 ===\n")

cursor.execute("""
    SELECT year, major, major_note, min_score
    FROM admission_data
    WHERE university_name = '浙江大学'
      AND major ILIKE '%人文科学试验班%'
    ORDER BY year
""")

results = cursor.fetchall()

if results:
    print(f"找到 {len(results)} 条记录:")
    for year, major, note, score in results:
        print(f"\n年份: {year}")
        print(f"专业: {major}")
        print(f"分数: {score}")
        print(f"备注: '{note}'")
else:
    print("未找到任何记录")

# 统计数据库中有专业备注的记录
print("\n=== 统计专业备注情况 ===\n")
cursor.execute("""
    SELECT
        CASE WHEN major_note IS NULL THEN '无备注'
             WHEN major_note = '' THEN '空字符串'
             ELSE '有备注' END as note_status,
        COUNT(*)
    FROM admission_data
    WHERE university_name = '浙江大学'
      AND year = 2025
    GROUP BY note_status
""")
print("浙江大学2025年专业备注统计:")
for status, count in cursor.fetchall():
    print(f"  {status}: {count} 条")

# 查看一些有备注的示例
print("\n=== 有专业备注的示例（其他院校）===")
cursor.execute("""
    SELECT university_name, major, major_note
    FROM admission_data
    WHERE major_note IS NOT NULL
      AND major_note != ''
    ORDER BY RANDOM()
    LIMIT 5
""")
for univ, major, note in cursor.fetchall():
    print(f"\n{univ} - {major}")
    print(f"  备注: {note}")

cursor.close()
conn.close()
