"""
查询数据库中科类字段的所有不同值
"""
import psycopg2
from dotenv import load_dotenv
import os
import sys

# 设置UTF-8输出编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 加载环境变量
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

cursor.execute("SELECT DISTINCT category FROM admission_data ORDER BY category;")
categories = cursor.fetchall()

print("数据库中的科类字段值：")
for cat in categories:
    count = cursor.execute("SELECT COUNT(*) FROM admission_data WHERE category = %s", (cat[0],))
    count = cursor.fetchone()[0]
    print(f"  {cat[0]}: {count} 条记录")

cursor.close()
conn.close()
