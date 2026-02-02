"""
检查专业备注字段的数据情况
"""
import psycopg2
from dotenv import load_dotenv
import sys

# 设置UTF-8输出编码
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

print("=== 检查专业备注字段 ===\n")

# 1. 统计有专业备注和无专业备注的记录数
cursor.execute("""
    SELECT
        CASE WHEN major_note IS NULL OR major_note = '' THEN '无备注'
        ELSE '有备注' END as note_status,
        COUNT(*)
    FROM admission_data
    GROUP BY note_status
""")
print("【专业备注统计】")
for status, count in cursor.fetchall():
    print(f"  {status}: {count:,} 条")

# 2. 查询一些有专业备注的示例
print("\n【有专业备注的示例（前20条）】")
cursor.execute("""
    SELECT university_name, major, major_note
    FROM admission_data
    WHERE major_note IS NOT NULL AND major_note != ''
    LIMIT 20
""")
for univ, major, note in cursor.fetchall():
    print(f"  {univ} - {major}")
    print(f"    备注: {note}")
    print()

# 3. 查询一些没有专业备注的示例
print("\n【无专业备注的示例（前10条）】")
cursor.execute("""
    SELECT university_name, major, major_note
    FROM admission_data
    WHERE major_note IS NULL OR major_note = ''
    LIMIT 10
""")
for univ, major, note in cursor.fetchall():
    print(f"  {univ} - {major}")
    print(f"    备注: {note if note else '空'}")
    print()

# 4. 检查major_note字段的数据类型
cursor.execute("""
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'admission_data'
    AND column_name = 'major_note'
""")
print("\n【字段信息】")
for col_info in cursor.fetchall():
    print(f"  字段名: {col_info[0]}")
    print(f"  数据类型: {col_info[1]}")
    print(f"  最大长度: {col_info[2]}")

cursor.close()
conn.close()
