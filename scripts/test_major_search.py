"""
测试专业名称查询
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

# 测试计算机专业查询
cursor.execute("""
    SELECT major, university_name
    FROM admission_data
    WHERE major ILIKE '%计算机%'
    LIMIT 5
""")
results = cursor.fetchall()

print(f"包含'计算机'的专业:")
for major, univ in results:
    print(f"  {major} - {univ}")

# 查看专业字段的实际内容
cursor.execute("""
    SELECT major
    FROM admission_data
    LIMIT 10
""")
print(f"\n数据库中的专业示例:")
for (major,) in cursor.fetchall():
    print(f"  '{major}'")

cursor.close()
conn.close()
