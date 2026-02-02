"""
检查Excel文件中专业的备注信息
"""
import pandas as pd
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

EXCEL_FILE = '../22-25年全国高校在浙江的专业录取分数.xlsx'

print("=== 读取Excel文件查看结构 ===\n")

# 读取Excel文件，查看列名
df = pd.read_excel(EXCEL_FILE)
print("Excel列名:")
print(df.columns.tolist())
print(f"\n总行数: {len(df)}")
print()

# 查看2025年浙江大学的数据
print("=== 2025年浙江大学数据 ===\n")
df_2025_zju = df[(df['年份'] == 2025) & (df['院校名称'].str.contains('浙江大学', na=False))]
print(f"找到 {len(df_2025_zju)} 条记录\n")

if len(df_2025_zju) > 0:
    # 查看列名和数据类型
    for col in df_2025_zju.columns:
        print(f"{col}: {df_2025_zju[col].dtype}")

    print("\n=== 人文科学试验班数据 ===\n")
    renwen = df_2025_zju[df_2025_zju['专业'].str.contains('人文科学', na=False)]
    if len(renwen) > 0:
        for idx, row in renwen.iterrows():
            print(f"专业: {row['专业']}")
            print(f"专业备注: {row.get('专业备注', 'N/A')}")
            print(f"所属专业组: {row.get('所属专业组', 'N/A')}")
            print(f"专业代码: {row.get('专业代码', 'N/A')}")
            print()
    else:
        print("未找到人文科学试验班")

    # 显示所有专业的前10条
    print("\n=== 浙江大学2025年前10个专业 ===\n")
    for idx, row in df_2025_zju.head(10).iterrows():
        print(f"专业: {row['专业']}")
        print(f"专业备注: '{row.get('专业备注', '')}'")
        print(f"所属专业组: '{row.get('所属专业组', '')}'")
        print()
