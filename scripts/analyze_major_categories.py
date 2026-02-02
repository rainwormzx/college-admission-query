"""
分析专业名称和科类的关系，寻找规律
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

print("=== 分析不同科类的专业特点 ===\n")

# 查询艺术类的专业
print("【艺术类】专业示例：")
cursor.execute("""
    SELECT DISTINCT major, COUNT(*)
    FROM admission_data
    WHERE category = '艺术类'
    GROUP BY major
    ORDER BY COUNT(*) DESC
    LIMIT 20
""")
for major, count in cursor.fetchall():
    print(f"  {major}: {count}条")

print("\n【体育类】专业示例：")
cursor.execute("""
    SELECT DISTINCT major, COUNT(*)
    FROM admission_data
    WHERE category = '体育类'
    GROUP BY major
    ORDER BY COUNT(*) DESC
    LIMIT 10
""")
for major, count in cursor.fetchall():
    print(f"  {major}: {count}条")

print("\n【综合】专业示例（前50个）：")
cursor.execute("""
    SELECT DISTINCT major
    FROM admission_data
    WHERE category = '综合'
    LIMIT 50
""")
majors = [row[0] for row in cursor.fetchall()]
for major in majors:
    print(f"  {major}")

# 分析综合类专业的关键词
print("\n=== 分析综合类专业的关键词 ===")

# 理工科关键词
science_keywords = ['计算机', '软件', '电子', '通信', '机械', '电气', '自动化', '土木',
                   '化工', '材料', '数学', '物理', '化学', '生物', '医学', '药学',
                   '临床', '口腔', '护理', '预防', '中医', '中西医', '药学', '医学技术',
                   '工程', '科学', '技术', '信息', '数据', '智能', '机器人', '航空航天',
                   '海洋', '地质', '矿业', '冶金', '能源', '动力', '水利', '测绘', '环境',
                   '建筑', '城规', '园林', '交通', '运输', '邮电', '食品']

# 文史关键词
arts_keywords = ['文学', '历史', '哲学', '政治', '思政', '马克思主义', '法学',
                '汉语言', '英语', '日语', '俄语', '德语', '法语', '西班牙语',
                '新闻', '传播', '广告', '编辑', '出版', '经济', '金融', '会计',
                '工商', '管理', '公共', '社会', '心理', '教育', '学前', '小教',
                '行政管理', '旅游', '酒店', '图书馆', '档案', '艺术设计', '音乐',
                '美术', '戏剧', '电影', '广播电视', '播音', '舞蹈']

cursor.execute("""
    SELECT COUNT(*), COUNT(DISTINCT major)
    FROM admission_data
    WHERE category = '综合'
""")
total_count, distinct_majors = cursor.fetchone()
print(f"\n综合类总记录数: {total_count}")
print(f"综合类不同专业数: {distinct_majors}")

# 统计包含理工关键词的专业
cursor.execute("""
    SELECT COUNT(DISTINCT major)
    FROM admission_data
    WHERE category = '综合'
      AND (
""")
keyword_conditions = ' OR '.join([f"major LIKE '%{kw}%'" for kw in science_keywords[:10]])
cursor.execute(f"""
    SELECT COUNT(DISTINCT major)
    FROM admission_data
    WHERE category = '综合'
      AND ({keyword_conditions})
""")
science_count = cursor.fetchone()[0]
print(f"包含理工关键词的专业数（前10个关键词）: {science_count}")

cursor.close()
conn.close()
