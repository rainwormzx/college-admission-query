"""
基于专业名称判断科类分类
"""
import psycopg2
from dotenv import load_dotenv
import sys
import re

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

# 定义专业关键词分类规则
ART_KEYWORDS = [
    '音乐', '美术', '艺术设计', '视觉传达', '环境设计', '产品设计',
    '服装设计', '动画', '绘画', '摄影', '雕塑', '书法', '舞蹈',
    '表演', '播音', '主持', '广播电视编导', '戏剧', '电影', '影视',
    '数字媒体艺术', '公共艺术', '工艺美术', '艺术设计学', '艺术史论',
    '录音艺术', '播音与主持', '戏曲', '曲艺', '文化产业管理'
]

SPORT_KEYWORDS = [
    '体育', '运动', '休闲体育', '社会体育', '体育教育', '运动训练',
    '运动康复', '运动人体科学', '武术与民族传统体育'
]

PHYSICS_KEYWORDS = [
    # 理工科
    '计算机', '软件', '电子', '通信', '电气', '自动化', '机械', '仪器',
    '材料', '冶金', '能源', '动力', '水利', '测绘', '化工', '制药',
    '轻工', '纺织', '食品', '建筑', '土木', '城规', '园林', '环境',
    '交通', '运输', '海洋', '航空航天', '兵器', '核工程', '地质', '矿业',
    '石油', '力学', '工程', '技术', '科学', '数学', '物理', '化学',
    '生物', '地理', '地球', '大气', '海洋', '天文',
    # 医学
    '临床', '口腔', '中医', '中西医', '药学', '医学', '护理', '预防',
    '医学技术', '康复', '针推', '针灸', '推拿'
]

HISTORY_KEYWORDS = [
    # 人文社科
    '文学', '历史', '哲学', '政治', '思政', '马克思主义', '法学',
    '汉语言', '英语', '日语', '韩语', '俄语', '德语', '法语', '西班牙语',
    '阿拉伯语', '葡萄牙语', '意大利语', '翻译', '新闻', '传播',
    # 经管类
    '经济', '金融', '会计', '财务', '工商', '管理', '公共', '行政',
    # 教育类
    '教育', '学前', '小教', '特殊教育',
    # 其他文科
    '社会学', '心理学', '旅游', '酒店', '图书', '档案', '出版'
]

def classify_major(major_name):
    """根据专业名称判断科类"""
    major_name = major_name.strip()

    # 艺术类
    for keyword in ART_KEYWORDS:
        if keyword in major_name:
            return '艺术类'

    # 体育类
    for keyword in SPORT_KEYWORDS:
        if keyword in major_name:
            return '体育类'

    # 物理类（理工农医）
    for keyword in PHYSICS_KEYWORDS:
        if keyword in major_name:
            return '物理类'

    # 历史类（人文社科经管）
    for keyword in HISTORY_KEYWORDS:
        if keyword in major_name:
            return '历史类'

    # 无法判断的，归为综合
    return '综合'

# 连接数据库
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

print("=== 测试分类规则 ===\n")

# 获取一些样例专业进行测试
test_cases = [
    '计算机科学与技术', '汉语言文学', '视觉传达设计', '体育教育',
    '临床医学', '会计学', '机械工程', '英语', '环境设计',
    '数学与应用数学', '法学', '电子信息工程', '工商管理', '音乐学'
]

print("【测试样例】")
for major in test_cases:
    category = classify_major(major)
    print(f"  {major}: {category}")

# 查询数据库中的实际分类
print("\n=== 对比数据库实际分类 ===\n")
cursor.execute("""
    SELECT major, category, COUNT(*)
    FROM admission_data
    WHERE category IN ('艺术类', '体育类')
    GROUP BY major, category
    ORDER BY category, COUNT(*) DESC
    LIMIT 30
""")
print("【数据库中的艺术类和体育类】")
for major, category, count in cursor.fetchall():
    print(f"  {major} -> {category}: {count}条")

# 统计"综合"类别中可以重新分类的专业
print("\n=== 统计可重新分类的综合类专业 ===\n")
cursor.execute("""
    SELECT DISTINCT major, COUNT(*)
    FROM admission_data
    WHERE category = '综合'
    GROUP BY major
    ORDER BY COUNT(*) DESC
""")
综合_majors = cursor.fetchall()

physics_count = 0
history_count = 0
art_count = 0
sport_count = 0
still_comprehensive = 0

for major, count in 综合_majors:
    new_category = classify_major(major)
    if new_category == '物理类':
        physics_count += count
    elif new_category == '历史类':
        history_count += count
    elif new_category == '艺术类':
        art_count += count
    elif new_category == '体育类':
        sport_count += count
    else:
        still_comprehensive += count

print(f"综合类可重新分类统计：")
print(f"  → 物理类: {physics_count} 条记录")
print(f"  → 历史类: {history_count} 条记录")
print(f"  → 艺术类: {art_count} 条记录")
print(f"  → 体育类: {sport_count} 条记录")
print(f"  → 仍为综合: {still_comprehensive} 条记录")

# 显示一些具体示例
print("\n【分类示例 - 综合类可改为物理类】")
cursor.execute("""
    SELECT DISTINCT major
    FROM admission_data
    WHERE category = '综合'
    LIMIT 100
""")
for row in cursor.fetchall():
    major = row[0]
    new_cat = classify_major(major)
    if new_cat in ['物理类', '历史类', '艺术类', '体育类']:
        print(f"  {major} -> {new_cat}")
        if len([r for r in locals().get('printed', []) if r < 20]) < 20:
            pass

cursor.close()
conn.close()
