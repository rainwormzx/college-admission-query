"""
查询2025年浙江大学人文科学试验班的专业备注
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

print("=== 查询2025年浙江大学人文科学试验班 ===\n")

# 查询这个具体的专业
cursor.execute("""
    SELECT year, university_name, major, major_note
    FROM admission_data
    WHERE year = 2025
      AND university_name = '浙江大学'
      AND major ILIKE '%人文科学试验班%'
""")

results = cursor.fetchall()

if results:
    print(f"找到 {len(results)} 条记录:")
    for year, univ, major, note in results:
        print(f"\n年份: {year}")
        print(f"院校: {univ}")
        print(f"专业: {major}")
        print(f"专业备注: '{note}'")
        print(f"专业备注类型: {type(note)}")
        print(f"专业备注长度: {len(note) if note else 0}")
else:
    print("未找到该记录")

# 查询浙江大学2025年所有含"试验班"的专业
print("\n=== 浙江大学2025年所有试验班专业 ===\n")
cursor.execute("""
    SELECT major, major_note
    FROM admission_data
    WHERE year = 2025
      AND university_name = '浙江大学'
      AND major ILIKE '%试验班%'
    LIMIT 10
""")

for major, note in cursor.fetchall():
    print(f"专业: {major}")
    print(f"备注: '{note}'")
    print()

cursor.close()
conn.close()
