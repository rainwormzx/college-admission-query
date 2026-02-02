# 快速部署到Railway

## 第一步：推送到GitHub

**Windows用户**：
```bash
# 运行部署准备脚本
cd D:\Vscode\高考志愿填报
scripts\deploy-to-railway.bat
```

**或者手动执行**：
```bash
cd D:\Vscode\高考志愿填报
git init
git add .
git commit -m "Prepare for Railway deployment"
git remote add origin https://github.com/你的用户名/college-admission-query.git
git push -u origin main
```

---

## 第二步：部署后端到Railway

1. **访问Railway**: https://railway.app/
2. **登录GitHub账号**
3. **点击**: `New Project` → `Deploy from GitHub repo`
4. **选择仓库**: `college-admission-query`
5. **配置后端**:
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm run start`

6. **添加PostgreSQL数据库**:
   - 在项目中点击 `New Service` → `Database` → `Add PostgreSQL`
   - Railway会自动创建数据库

7. **配置环境变量**:
   - 点击后端服务 → `Variables` → `New Variable`
   - 添加以下变量:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway
   ```
   - 从数据库服务复制 `DATABASE_URL`

8. **点击Deploy**，等待部署完成

9. **记录后端地址**，例如: `https://your-backend.up.railway.app`

---

## 第三步：部署前端到Vercel

1. **访问Vercel**: https://vercel.com/
2. **登录GitHub账号**
3. **点击**: `New Project`
4. **选择仓库**: `college-admission-query`
5. **配置前端**:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`

6. **配置环境变量**:
   - Environment Variables → `New Variable`
   - Name: `VITE_API_URL`
   - Value: `https://your-backend.up.railway.app` (你的Railway后端地址)

7. **点击Deploy**，等待部署完成

8. **获取前端地址**，例如: `https://your-app.vercel.app`

---

## 第四步：导入数据

### 方法1: 使用Railway CLI (推荐)

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录Railway
railway login

# 连接数据库代理
railway proxy

# 在新的终端窗口，运行导入脚本
cd D:\Vscode\高考志愿填报\scripts
# 修改 .env 中的 DATABASE_URL 为Railway数据库地址
python import-excel.py
```

### 方法2: 使用Railway Console

1. 在Railway后端服务，点击 `Console` 标签
2. 运行数据库迁移:
```bash
npx prisma db push
```

---

## 访问应用

部署完成后，访问Vercel提供的前端地址即可使用应用！

**示例**: `https://college-admission-query.vercel.app`

---

## 常见问题

### Q: Railway部署失败怎么办？
**A**: 检查以下几点：
- 确保 `backend/package.json` 中有正确的启动脚本
- 检查环境变量是否正确配置
- 查看Railway的部署日志

### Q: 前端无法连接后端？
**A**: 检查：
- Vite环境变量 `VITE_API_URL` 是否正确
- 后端CORS配置是否允许前端域名
- 查看浏览器控制台的网络错误

### Q: 数据库连接失败？
**A**:
- 确保 `DATABASE_URL` 格式正确
- 检查PostgreSQL服务是否正在运行
- 运行 `npx prisma generate` 重新生成客户端

---

## 成本说明

- **Railway免费额度**: $5/月试用
- **付费套餐**:
  - Eco: $5/月 (适合个人项目)
  - Basic: $10/月 (适合小型应用)
  - Pro: $20/月 (适合生产环境)

- **Vercel**: 免费套餐包含100GB带宽/月

---

## 需要帮助？

- 📖 完整文档: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- 📚 Railway文档: https://docs.railway.app/
- 📚 Vercel文档: https://vercel.com/docs
- 💬 Railway Discord: https://discord.gg/railway

---

**祝部署顺利！** 🚀
