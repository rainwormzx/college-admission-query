# 🚀 Railway部署 - 立即开始

## ✅ 已完成的准备工作

- ✅ Git仓库已初始化
- ✅ 代码已提交到本地仓库
- ✅ Railway配置文件已创建
- ✅ 部署脚本已准备

---

## 📝 第一步：创建GitHub仓库

1. **访问GitHub**: https://github.com/new
2. **创建新仓库**:
   - Repository name: `college-admission-query`
   - 设为Public（公开）或Private（私有）
   - 不要勾选"Add a README file"
   - 点击"Create repository"

3. **关联远程仓库**:
   ```bash
   cd D:\Vscode\高考志愿填报
   git remote add origin https://github.com/你的GitHub用户名/college-admission-query.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 第二步：部署后端到Railway

### 2.1 注册Railway
1. 访问: https://railway.app/
2. 点击右上角 "Login"
3. 使用GitHub账号登录并授权

### 2.2 部署后端服务
1. 在Railway控制台，点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 找到并选择 `college-admission-query` 仓库
4. 点击 "Deploy Now"

### 2.3 配置后端
在部署页面设置：
- **Root Directory**: 输入 `backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

点击 "Deploy" 按钮，等待Railway检测项目配置。

### 2.4 添加PostgreSQL数据库
1. 在项目页面，点击 "New Service"
2. 选择 "Database" → "Add PostgreSQL"
3. Railway会自动创建数据库（免费版有512MB限制）

### 2.5 配置环境变量
1. 点击后端服务（admission-query-backend）
2. 选择 "Variables" 标签
3. 点击 "New Variable"，添加以下变量：

```
NODE_ENV=production
PORT=3000
```

4. 获取数据库URL:
   - 点击数据库服务（PostgreSQL）
   - 选择 "Variables" 标签
   - 复制 `DATABASE_URL` 的值
   - 回到后端服务，粘贴到环境变量中

5. 点击 "Deploy" 重新部署后端

### 2.6 记录后端地址
部署成功后，Railway会在顶部显示后端地址，例如:
```
https://college-admission-query-backend.up.railway.app
```

**复制这个地址**，部署前端时需要用到！

---

## 🎨 第三步：部署前端到Vercel

### 3.1 注册Vercel
1. 访问: https://vercel.com/
2. 点击 "Sign Up"
3. 使用GitHub账号登录

### 3.2 部署前端
1. 点击 "New Project"
2. 找到并选择 `college-admission-query` 仓库
3. 点击 "Import"

### 3.3 配置前端项目
在项目配置页面：
- **Framework Preset**: 选择 "Vite"（会自动检测）
- **Root Directory**: 输入 `frontend`
- **Build Command**: `npm run build`（自动填充）
- **Output Directory**: `dist`（自动填充）

### 3.4 配置环境变量
1. 找到 "Environment Variables" 部分
2. 点击 "New Variable"
3. 添加:
   - **Key**: `VITE_API_URL`
   - **Value**: 粘贴你的Railway后端地址
     ```
     https://college-admission-query-backend.up.railway.app
     ```

### 3.5 点击 "Deploy"
等待几分钟，Vercel会构建并部署前端。

### 3.6 获取前端地址
部署成功后，Vercel会提供一个域名，例如:
```
https://college-admission-query.vercel.app
```

**恭喜！🎉** 现在你可以访问这个地址使用你的应用了！

---

## 📊 第四步：导入数据（重要！）

部署成功后，数据库是空的，需要导入89,185条录取数据。

### 方法1: 使用Railway CLI（推荐）

```bash
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录Railway
railway login

# 3. 连接到你的项目
cd D:\Vscode\高考志愿填报
railway link

# 4. 启动数据库代理
railway proxy

# 5. 打开新的终端窗口，修改数据库连接
# 编辑 backend/.env 文件，将 DATABASE_URL 改为Railway提供的地址

# 6. 导入数据
cd D:\Vscode\高考志愿填报\scripts
python import-excel.py
```

### 方法2: 使用Railway Console（简化版）

如果只需要测试功能，可以先导入少量数据：

1. 在Railway后端服务，点击 "Console" 标签
2. 运行:
```bash
npx prisma db push
```

这会创建数据库表结构，但没有数据。你需要通过API或脚本导入数据。

### 方法3: 创建数据导入API（生产环境推荐）

在后端添加一个临时导入接口，通过上传Excel文件导入数据。

---

## ✅ 验证部署

访问你的Vercel前端地址，检查以下功能：

1. **首页**: 能否正常打开
2. **查询页面**: 能否进行搜索
3. **推荐页面**: 输入分数，能否获取推荐
4. **统计页面**: 能否显示图表
5. **对比页面**: 能否进行对比

---

## 🔧 常见问题

### Q: Railway显示 "Deployment failed"？
**A**:
1. 检查 "Build Logs" 查看具体错误
2. 确保 `backend/package.json` 配置正确
3. 检查环境变量是否都设置了

### Q: 前端打开空白？
**A**:
1. 检查 `VITE_API_URL` 是否正确
2. 打开浏览器控制台（F12）查看错误信息
3. 确保后端已经部署成功

### Q: CORS错误？
**A**:
在后端 `src/server.ts` 中添加：
```typescript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Q: 数据库连接失败？
**A**:
1. 确保 `DATABASE_URL` 格式正确
2. 检查PostgreSQL服务是否在运行
3. 在Railway Console运行 `npx prisma generate`

---

## 💰 成本估算

- **Railway**: 免费试用$5，之后最低$5/月
- **Vercel**: 免费套餐足够个人使用
- **总成本**: $0-5/月

---

## 🎯 下一步

部署成功后，你可以：
1. 导入完整数据集
2. 配置自定义域名
3. 添加用户认证
4. 优化性能和UI
5. 添加更多功能

---

**祝部署顺利！** 🚀

如有问题，查看详细文档: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
