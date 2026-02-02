# 高考志愿填报系统 - Railway 部署指南

本指南将帮助您将高考志愿填报系统部署到Railway公网。

## 部署架构

- **后端**: Railway Node.js服务
- **数据库**: Railway PostgreSQL
- **前端**: Vercel (推荐) 或 Railway静态站点

## 方案一：后端部署到Railway + 前端部署到Vercel (推荐)

### 步骤1: 准备GitHub仓库

```bash
# 在项目根目录执行
cd "D:\Vscode\高考志愿填报"

# 初始化Git仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 高考志愿填报系统"

# 创建GitHub仓库后，关联远程仓库
git remote add origin https://github.com/your-username/college-admission-query.git

# 推送到GitHub
git push -u origin main
```

### 步骤2: 部署后端到Railway

#### 2.1 注册Railway
1. 访问 https://railway.app/
2. 点击 "Start a New Project"
3. 使用GitHub账号登录并授权

#### 2.2 部署后端服务
1. 在Railway控制台，点击 "New Project" → "Deploy from GitHub repo"
2. 选择刚创建的仓库 `college-admission-query`
3. Railway会自动检测到Node.js项目
4. 点击 "Deploy Variables" 配置环境变量：

**必需的环境变量**：
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@host:5432/admission_query
```

#### 2.3 添加PostgreSQL数据库
1. 在项目页面，点击 "New Service" → "Database" → "Add PostgreSQL"
2. Railway会自动创建数据库
3. 点击数据库服务，复制 "DATABASE_URL" 的值
4. 回到后端服务，将DATABASE_URL粘贴到环境变量中

#### 2.4 运行数据库迁移
Railway会自动检测到`prisma`并在部署时生成客户端。但需要导入数据：

**方法1: 使用Railway Console**
1. 在Railway控制台，进入后端服务
2. 点击 "Console" 标签
3. 运行命令：
```bash
npx prisma db push
```

**方法2: 本地连接Railway数据库导入数据**
```bash
# 获取Railway数据库连接信息
# 在Railway数据库服务页面，点击 "Connect" → "Connect with CLI"

# 本地运行导入脚本（需要修改数据库连接）
cd scripts
python import-excel-to-railway.py
```

#### 2.5 获取后端API地址
部署成功后，Railway会提供一个公网地址，例如：
```
https://your-backend.up.railway.app
```

记录这个地址，配置前端时需要用到。

### 步骤3: 部署前端到Vercel

#### 3.1 注册Vercel
1. 访问 https://vercel.com/
2. 使用GitHub账号登录

#### 3.2 部署前端
1. 点击 "New Project"
2. 选择GitHub仓库 `college-admission-query`
3. 设置根目录为 `frontend`
4. 配置环境变量：

```bash
VITE_API_URL=https://your-backend.up.railway.app
```

#### 3.3 构建配置
Vercel会自动检测到Vite项目并构建。如果需要自定义，创建 `frontend/vercel.json`：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.up.railway.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 3.4 获取前端地址
部署成功后，Vercel会提供一个地址，例如：
```
https://your-app.vercel.app
```

---

## 方案二：全栈部署到Railway

### 步骤1: 修改项目结构

创建根目录的 `package.json` 用于Railway monorepo配置：

```json
{
  "name": "college-admission-query",
  "private": true,
  "workspaces": [
    "backend",
    "frontend"
  ],
  "scripts": {
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install"
  }
}
```

### 步骤2: 创建Railway配置文件

在项目根目录创建 `railway.toml`：

```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 180
restartPolicyType = "ON_FAILURE"
```

### 步骤3: 在Railway部署后端

1. 在Railway创建新项目，连接GitHub仓库
2. Railway会自动检测后端的 `package.json`
3. 设置Root Directory为 `backend`
4. 配置环境变量和数据库（同方案一步骤2）

### 步骤4: 在Railway部署前端

1. 在同一项目中，点击 "New Service"
2. 选择 "GitHub Repo"
3. 设置Root Directory为 `frontend`
4. 配置环境变量 `VITE_API_URL` 指向后端地址
5. 部署完成后，前端会获得一个公网地址

---

## 数据导入方案

### 方案1: 使用Railway Proxy (推荐用于测试)

在本地修改数据库连接字符串，通过Railway CLI代理连接：

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录Railway
railway login

# 连接到数据库
railway proxy

# 在另一个终端运行导入脚本
cd scripts
# 修改 .env 中的 DATABASE_URL 为 Railway 数据库 URL
python import-excel.py
```

### 方案2: 使用Railway Console直接导入

1. 在Railway后端服务中，进入Console
2. 安装Python和依赖（Railway环境可能不包含Python）
3. 或者创建一个Node.js导入脚本替代Python脚本

### 方案3: 创建导入API (推荐)

在后端创建一个数据导入API接口：

```typescript
// backend/src/routes/import.ts
import express from 'express';
import * as XLSX from 'xlsx';
import prisma from '../utils/database';

const router = express.Router();

router.post('/import-data', async (req, res) => {
  try {
    // 从请求体读取Excel文件数据或URL
    // 导入到数据库
    res.json({ success: true, count: importedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

然后通过API调用导入数据。

---

## 环境变量配置清单

### 后端环境变量 (Railway)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway
CORS_ORIGIN=https://your-app.vercel.app
```

### 前端环境变量 (Vercel)
```bash
VITE_API_URL=https://your-backend.up.railway.app
```

---

## 域名配置 (可选)

### Railway自定义域名
1. 进入项目设置 → Domains
2. 点击 "Add Domain"
3. 输入域名，如 `api.yourdomain.com`
4. 按照提示配置DNS记录

### Vercel自定义域名
1. 进入项目设置 → Domains
2. 添加域名 `www.yourdomain.com`
3. 配置DNS记录：CNAME指向 `cname.vercel-dns.com`

---

## 成本估算

### Railway (后端+数据库)
- 免费套餐：$5/月试用额度
- 付费套餐：
  - Eco: $5/月 (256MB RAM, 0.5GB存储)
  - Basic: $10/月 (512MB RAM, 1GB存储)
  - Pro: $20/月 (1GB RAM, 2GB存储)

### Vercel (前端)
- 免费套餐：100GB带宽/月
- Pro: $20/月 (1TB带宽)

### 总成本
- 最低：$5/月 (仅Railway Eco套餐)
- 推荐：$15/月 (Railway Basic + Vercel Pro)

---

## 故障排查

### 问题1: 后端部署失败
- 检查 `backend/package.json` 中的 `start` 脚本
- 查看Railway部署日志
- 确保所有依赖都在 `dependencies` 中（不是 `devDependencies`）

### 问题2: 数据库连接失败
- 确保 `DATABASE_URL` 环境变量正确
- 检查PostgreSQL服务是否正在运行
- 运行 `npx prisma generate` 重新生成客户端

### 问题3: 前端无法连接后端
- 检查 `VITE_API_URL` 环境变量
- 确保后端CORS配置允许前端域名
- 查看浏览器控制台的网络请求错误

### 问题4: 数据未导入
- Railway环境可能不支持Python脚本
- 建议使用Railway CLI代理本地连接
- 或者创建Node.js导入脚本

---

## 部署后续操作

部署成功后，您需要：

1. **导入数据**：使用上述方法导入89,185条录取数据
2. **测试功能**：验证查询、推荐、统计等功能
3. **配置域名**：添加自定义域名（可选）
4. **监控日志**：在Railway和Vercel控制台监控应用状态
5. **设置告警**：配置错误率和性能告警

---

## 快速开始（推荐流程）

### 最快部署路线（约15分钟）

1. **推送到GitHub** (2分钟)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/college-admission-query.git
   git push -u origin main
   ```

2. **部署后端到Railway** (5分钟)
   - 登录Railway
   - 连接GitHub仓库
   - 添加PostgreSQL数据库
   - 配置环境变量
   - 点击Deploy

3. **部署前端到Vercel** (5分钟)
   - 登录Vercel
   - 导入项目
   - 配置API地址
   - 点击Deploy

4. **导入数据** (3分钟+)
   - 使用Railway CLI连接数据库
   - 本地运行导入脚本

5. **测试上线** (几分钟)
   - 访问Vercel提供的前端地址
   - 测试各项功能

---

## 需要帮助？

- Railway文档: https://docs.railway.app/
- Vercel文档: https://vercel.com/docs
- Prisma文档: https://www.prisma.io/docs

---

**祝您部署顺利！** 🚀
