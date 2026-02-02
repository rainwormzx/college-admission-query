"""
测试院校名称查询
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

# 测试查询
cursor.execute("""
    SELECT university_name, major, year
    FROM admission_data
    WHERE university_name LIKE '%清华%'
    LIMIT 5
""")
results = cursor.fetchall()

print(f"找到 {len(results)} 条包含'清华'的记录:")
for univ, major, year in results:
    print(f"  {univ} - {major} - {year}")

cursor.close()
conn.close()
