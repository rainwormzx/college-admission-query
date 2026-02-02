# 高考志愿填报查询系统

基于2022-2025年全国高校在浙江省的专业录取数据的全栈查询系统。

## 功能特性

✅ **多条件组合查询** - 支持按专业、院校地区、最低分数、最低位次等条件查询
✅ **数据导出** - 将查询结果导出为Excel文件
✅ **数据统计图表** - 分数分布、地区统计、专业热度、年份趋势可视化
✅ **志愿推荐** - 根据分数和位次智能推荐冲刺/稳妥/保底院校
✅ **多年份对比** - 对比不同年份的录取分数和位次变化

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5（UI组件库）
- ECharts（数据可视化）
- Vite（构建工具）
- Axios（HTTP客户端）

### 后端
- Node.js + Express + TypeScript
- PostgreSQL（数据库）
- Prisma（ORM）
- ExcelJS（Excel导出）

## 项目结构

```
高考志愿填报/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── services/     # API服务
│   │   └── types/        # TypeScript类型
│   └── package.json
│
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/      # API路由
│   │   ├── services/    # 业务逻辑
│   │   └── utils/       # 工具函数
│   ├── prisma/          # Prisma配置
│   └── package.json
│
├── scripts/           # 数据处理脚本
│   └── import-excel.py # Excel导入脚本
│
└── data/              # 数据文件
    └── 22-25年全国高校在浙江的专业录取分数.xlsx
```

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 14
- Python >= 3.8

### 1. 数据库设置

```bash
# 创建数据库
createdb admission_query

# 或使用psql
psql -U postgres
CREATE DATABASE admission_query;
\q
```

### 2. 后端设置

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，设置数据库连接信息
DATABASE_URL="postgresql://user:password@localhost:5432/admission_query?schema=public"
PORT=3000
CORS_ORIGIN="http://localhost:5173"

# 生成Prisma客户端
npm run prisma:generate

# 创建数据库表
npm run prisma:migrate
```

### 3. 导入数据

```bash
# 进入scripts目录
cd scripts

# 安装Python依赖
pip install -r requirements.txt

# 导入Excel数据
python import-excel.py
```

### 4. 启动后端服务

```bash
cd backend
npm run dev
```

后端服务将在 http://localhost:3000 启动

### 5. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:5173 启动

## API接口

### 查询接口
```
POST /api/admission/search
Body: {
  major?: string,              // 专业名称（模糊查询）
  schoolLocation?: string,     // 院校地区
  minScore?: { min?: number, max?: number },  // 最低分数范围
  minRank?: { min?: number, max?: number },   // 最低位次范围
  year?: number[],             // 年份筛选（多选）
  page?: number,               // 页码
  pageSize?: number,           // 每页数量
  sortBy?: string,             // 排序字段
  sortOrder?: 'asc' | 'desc'   // 排序方向
}
```

### 统计接口
```
GET /api/admission/stats?year=2025&major=计算机&schoolLocation=北京
Response: {
  scoreDistribution: { score: number, count: number }[],
  locationStats: { location: string, count: number }[],
  majorStats: { major: string, count: number }[],
  yearlyTrend: { year: number, avgScore: number }[]
}
```

### 推荐接口
```
POST /api/admission/recommend
Body: {
  score: number,              // 考生分数
  rank: number,               // 考生位次
  year?: number,              // 目标年份（默认最新年份）
  category?: string,          // 科类
  subject?: string            // 选科
}
Response: {
  冲刺: AdmissionData[],
  稳妥: AdmissionData[],
  保底: AdmissionData[]
}
```

### 导出接口
```
POST /api/admission/export
Body: (同查询接口)
Response: Excel文件下载
```

### 对比接口
```
POST /api/admission/compare
Body: {
  university: string,         // 院校名称
  major?: string,             // 专业（可选）
  years: number[]             // 对比年份
}
```

## 开发命令

### 前端
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产版本
```

### 后端
```bash
npm run dev           # 启动开发服务器（热重载）
npm run build         # 构建生产版本
npm start             # 启动生产服务器
npm run prisma:generate  # 生成Prisma客户端
npm run prisma:migrate    # 运行数据库迁移
```

## 部署建议

### 开发环境
- 前端：localhost:5173
- 后端：localhost:3000
- 数据库：本地PostgreSQL

### 生产环境
- **前端部署**：Vercel / Netlify
- **后端部署**：Railway / Render / 腾讯云
- **数据库**：Supabase / 腾讯云PostgreSQL

## 常见问题

### 1. 数据库连接失败
- 检查PostgreSQL是否运行
- 检查.env文件中的数据库连接信息是否正确
- 确保数据库已创建

### 2. 数据导入失败
- 检查Excel文件路径是否正确
- 确保Python依赖已正确安装
- 检查数据库表是否已创建

### 3. 前端无法连接后端
- 检查后端服务是否运行
- 检查CORS配置
- 检查API代理配置（vite.config.ts）

## 许可证

MIT

## 联系方式

如有问题，请提交Issue。
