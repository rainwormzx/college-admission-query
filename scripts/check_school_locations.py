"""
检查院校地区字段的数据情况
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

print("=== 检查院校地区字段 ===\n")

# 查询所有不同的院校地区
cursor.execute("""
    SELECT DISTINCT school_location
    FROM admission_data
    WHERE school_location IS NOT NULL AND school_location != ''
    ORDER BY school_location
""")
locations = cursor.fetchall()

print(f"数据库中有 {len(locations)} 个不同的地区:")
for (loc,) in locations:
    print(f"  {loc}")

# 统计一些主要地区的数据量
print("\n=== 主要地区数据量统计 ===\n")
cursor.execute("""
    SELECT school_location, COUNT(*) as count
    FROM admission_data
    WHERE school_location IS NOT NULL AND school_location != ''
    GROUP BY school_location
    ORDER BY count DESC
    LIMIT 20
""")
for loc, count in cursor.fetchall():
    print(f"  {loc}: {count:,} 条")

# 检查是否有北京、上海、浙江、江苏、广东
print("\n=== 检查前端筛选选项 ===\n")
target_locations = ['北京', '上海', '浙江', '江苏', '广东']
for target in target_locations:
    cursor.execute("""
        SELECT COUNT(*)
        FROM admission_data
        WHERE school_location = %s
    """, (target,))
    count = cursor.fetchone()[0]
    print(f"  {target}: {count:,} 条")

cursor.close()
conn.close()
