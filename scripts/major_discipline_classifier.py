"""
基于教育部12个学科门类进行专业分类
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

# 12个学科门类关键词定义
DISCIPLINE_KEYWORDS = {
    '哲学': [
        '哲学', '马克思主义哲学', '中国哲学', '外国哲学', '逻辑学', '伦理学',
        '美学', '宗教学', '科学技术哲学', '美学', '逻辑学'
    ],

    '经济学': [
        '经济', '金融', '金融学', '国际经济', '贸易', '经济学', '财政', '税务',
        '保险', '投资', '金融工程', '金融数学', '经济与金融', '信用管理'
    ],

    '法学': [
        '法学', '法律', '知识产权', '监狱学', '司法', '侦查', '治安',
        '公安', '消防', '政治', '社会学', '社会工作', '国际政治'
    ],

    '教育学': [
        '教育', '学前教育', '小学教育', '特殊教育', '体育教育', '运动训练',
        '社会体育', '运动康复', '运动人体科学', '休闲体育', '武术',
        '体育', '运动', '教练'
    ],

    '文学': [
        '文学', '汉语言', '汉语', '英语', '日语', '俄语', '德语', '法语',
        '西班牙语', '阿拉伯语', '朝鲜语', '葡萄牙语', '意大利语',
        '翻译', '商务英语', '新闻', '传播', '广告学', '编辑出版',
        '网络与新媒体', '数字出版', '汉语国际教育', '外国语言'
    ],

    '历史学': [
        '历史', '世界史', '考古', '文物', '博物馆', '文物保护',
        '文化遗产', '古生物学', '历史学'
    ],

    '理学': [
        '数学', '物理', '化学', '生物', '地理', '天文', '大气',
        '海洋', '地球', '地质', '力学', '统计学', '应用统计',
        '应用化学', '应用物理', '应用数学', '化学生物', '分子科学',
        '心理学', '信息与计算', '数理', '生态', '环境科学'
    ],

    '工学': [
        '计算机', '软件', '电子', '通信', '电气', '自动化', '机械',
        '仪器', '材料', '冶金', '能源', '动力', '水利', '测绘',
        '化工', '轻工', '纺织', '食品', '建筑', '土木', '城规',
        '园林', '环境', '交通', '运输', '海洋', '航空航天', '兵器',
        '核工程', '地质', '矿业', '石油', '力学', '工程', '技术',
        '安全', '公安', '消防', '包装', '印刷', '船舶', '汽车',
        '铁路', '公路', '民航', '飞行', '制药', '生物工程', '生物医学',
        '信息', '网络', '物联网', '数据', '智能', '机器人', '集成电路',
        '微电子', '光电', '测控', '电气工程', '控制', '系统', '工业设计'
    ],

    '农学': [
        '农学', '园艺', '植物', '动物', '动物医学', '动物科学', '水产',
        '海洋渔业', '林业', '园林', '草业', '农业', '农村', '兽',
        '林学', '园艺', '植物保护', '植保', '农业资源', '农业工程'
    ],

    '医学': [
        '临床', '口腔', '中医', '中西医', '药学', '医学', '护理',
        '预防', '公共卫生', '医学技术', '康复', '针推', '针灸',
        '推拿', '影像', '检验', '眼视光', '精神', '麻醉', '儿科学',
        '妇产', '肿瘤', '心血管', '呼吸', '消化', '内分泌', '神经',
        '皮肤', '性病', '传染', '结核', '血液', '肾脏', '泌尿', '外',
        '内', '骨', '耳鼻', '喉', '口腔', '病理', '法医', '护理',
        '助产', '药学', '中药', '药物', '制剂', '生物制药', '临床药学'
    ],

    '管理学': [
        '管理', '会计', '财务', '工商', '公共', '行政', '人力资源',
        '市场营销', '旅游', '酒店', '物流', '供应链', '电子商务',
        '信息管理', '信息系统', '工程管理', '项目管理', '房地产',
        '土地资源', '农林经济', '农村区域', '图书馆', '档案', '保密',
        '行政管理', '公共事业', '劳动', '社保', '城市管理', '海关'
    ],

    '艺术学': [
        '艺术', '音乐', '美术', '设计', '视觉传达', '环境', '产品设计',
        '服装', '动画', '绘画', '雕塑', '书法', '舞蹈', '表演', '播音',
        '主持', '广播电视', '编导', '戏剧', '电影', '影视', '摄影',
        '录音', '公共艺术', '工艺美术', '数字媒体', '艺术史', '艺术理论',
        '戏曲', '曲艺', '珠宝', '首饰', '陶瓷', '漆艺', '时装'
    ]
}

def classify_by_discipline(major_name):
    """根据专业名称判断学科门类"""
    major_name = major_name.strip()

    # 优先匹配长关键词，避免短关键词误匹配
    for discipline, keywords in DISCIPLINE_KEYWORDS.items():
        # 按关键词长度降序排列
        sorted_keywords = sorted(keywords, key=len, reverse=True)
        for keyword in sorted_keywords:
            if keyword in major_name:
                return discipline

    # 无法判断的，返回空字符串
    return ''

# 连接数据库
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

print("=== 测试12个学科门类分类器 ===\n")

# 测试样例
test_cases = [
    ('哲学', '哲学'),
    ('经济学', '经济学'),
    ('计算机科学与技术', '工学'),
    ('汉语言文学', '文学'),
    ('临床医学', '医学'),
    ('工商管理', '管理学'),
    ('视觉传达设计', '艺术学'),
    ('数学与应用数学', '理学'),
    ('土木工程', '工学'),
    ('历史学', '历史学'),
    ('体育教育', '教育学'),
    ('金融学', '经济学'),
    ('法学', '法学'),
    ('园艺', '农学'),
    ('护理学', '医学')
]

print("【测试样例】")
all_correct = True
for major, expected in test_cases:
    result = classify_by_discipline(major)
    status = "✓" if result == expected else "✗"
    if result != expected:
        all_correct = False
    print(f"  {status} {major}: {result} (期望: {expected})")

if all_correct:
    print("\n✅ 所有测试样例通过！\n")
else:
    print("\n⚠️ 部分测试样例未通过，需要调整关键词\n")

# 统计数据库中的专业
print("=== 分析数据库中的专业分布 ===\n")
cursor.execute("""
    SELECT COUNT(*) FROM admission_data
""")
total = cursor.fetchone()[0]
print(f"数据库总记录数: {total}\n")

# 按当前科类统计
cursor.execute("""
    SELECT category, COUNT(*)
    FROM admission_data
    GROUP BY category
    ORDER BY COUNT(*) DESC
""")
print("【当前科类分布】")
for cat, count in cursor.fetchall():
    print(f"  {cat}: {count} 条")

# 统计综合类专业可以如何重新分类
print("\n=== 综合类专业重新分类统计 ===\n")

cursor.execute("""
    SELECT DISTINCT major, COUNT(*) as count
    FROM admission_data
    WHERE category = '综合'
    GROUP BY major
""")
综合_majors = cursor.fetchall()

discipline_count = {d: 0 for d in DISCIPLINE_KEYWORDS.keys()}
unclassified_count = 0

for major, count in 综合_majors:
    discipline = classify_by_discipline(major)
    if discipline:
        discipline_count[discipline] += count
    else:
        unclassified_count += count

print("【综合类可重新分类结果】")
for discipline, count in sorted(discipline_count.items(), key=lambda x: x[1], reverse=True):
    pct = count / 88777 * 100 if count > 0 else 0
    print(f"  {discipline}: {count:,} 条 ({pct:.1f}%)")

print(f"\n  未分类: {unclassified_count:,} 条 ({unclassified_count/88777*100:.1f}%)")

# 显示各门类具体示例
print("\n=== 各学科门类专业示例 ===\n")
for discipline in DISCIPLINE_KEYWORDS.keys():
    cursor.execute("""
        SELECT DISTINCT major
        FROM admission_data
        WHERE category = '综合'
        LIMIT 500
    """)
    examples = []
    for row in cursor.fetchall():
        major = row[0]
        if classify_by_discipline(major) == discipline:
            examples.append(major)
            if len(examples) >= 5:
                break

    if examples:
        print(f"【{discipline}】")
        for ex in examples:
            print(f"  - {ex}")
        print()

cursor.close()
conn.close()

print("\n=== 统计完成 ===")
