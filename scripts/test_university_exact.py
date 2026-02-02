"""
测试院校名称精确查询
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

# 查看university_name字段实际内容
cursor.execute("""
    SELECT university_name
    FROM admission_data
    WHERE university_name ILIKE '%清华%'
    LIMIT 5
""")
results = cursor.fetchall()

print(f"数据库中包含'清华'的院校名称:")
for (univ,) in results:
    print(f"  '{univ}'")

# 测试ILIKE查询
cursor.execute("""
    SELECT COUNT(*)
    FROM admission_data
    WHERE university_name ILIKE '%清华%'
""")
count = cursor.fetchone()[0]
print(f"\n使用 ILIKE '%清华%' 找到 {count} 条记录")

cursor.close()
conn.close()
