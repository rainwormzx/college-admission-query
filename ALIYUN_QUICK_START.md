# 阿里云部署 - 快速开始

## 5分钟快速部署指南

### 第一步：购买服务器（2分钟）

1. **访问**：https://www.aliyun.com/product/swas
2. **选择配置**：
   - 2核2GB - ¥108/年 ✅ 推荐
   - 2核4GB - ¥168/年 ✅ 更流畅
3. **操作系统**：Ubuntu 22.04
4. **购买并付款**

**获取服务器信息**：
- 公网IP：如 `47.97.123.45`
- root密码：重置并记录

---

### 第二步：连接服务器（1分钟）

**Windows用户**：
```powershell
ssh root@你的公网IP
# 输入密码
```

**Mac/Linux用户**：
```bash
ssh root@你的公网IP
```

---

### 第三步：一键部署脚本（2分钟）

连接成功后，复制粘贴以下命令：

```bash
# 下载并执行部署脚本
curl -o /root/deploy.sh https://raw.githubusercontent.com/你的用户名/college-admission-query/main/scripts/aliyun-deploy.sh
chmod +x /root/deploy.sh
bash /root/deploy.sh
```

**脚本会自动完成**：
- ✅ 安装Node.js 18
- ✅ 安装PostgreSQL 14
- ✅ 安装Nginx
- ✅ 安装PM2
- ✅ 克隆项目代码
- ✅ 配置数据库
- ✅ 部署后端和前端
- ✅ 配置Nginx反向代理

---

### 第四步：导入数据（需要Excel文件）

**在本地Windows电脑**：
```powershell
# 上传Excel文件到服务器
scp D:\Vscode\高考志愿填报\22-25年全国高校在浙江的专业录取分数.xlsx root@你的服务器IP:/tmp/
```

**在服务器上**：
```bash
# 安装Python和依赖
apt install -y python3 python3-pip
pip3 install openpyxl psycopg2-binary python-dotenv

# 导入数据
cd /var/www/college-admission-query/scripts
python3 import-excel.py
```

---

### 第五步：访问网站

在浏览器打开：
```
http://你的公网IP
```

**完成！** 🎉

---

## 手动部署（如果脚本失败）

### 1. 安装Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v
```

### 2. 安装PostgreSQL
```bash
apt install -y postgresql-14 postgresql-contrib-14
systemctl start postgresql
systemctl enable postgresql

# 创建数据库
sudo -u postgres psql
CREATE DATABASE admission_query;
CREATE USER rainworm WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE admission_query TO rainworm;
\q
```

### 3. 安装Nginx和PM2
```bash
apt install -y nginx pm2
systemctl start nginx
systemctl enable nginx
```

### 4. 部署后端
```bash
cd /var/www
git clone https://github.com/你的用户名/college-admission-query.git
cd college-admission-query/backend

cat > .env << 'EOF'
DATABASE_URL=postgresql://rainworm:your_password@localhost:5432/admission_query
NODE_ENV=production
PORT=3000
EOF

npm install
npx prisma generate
npx prisma db push
npm run build
pm2 start dist/server.js --name "admission-backend"
pm2 save
pm2 startup
```

### 5. 部署前端
```bash
cd /var/www/college-admission-query/frontend
cat > .env.production << 'EOF'
VITE_API_URL=http://你的公网IP:3000
EOF

npm install
npm run build
```

### 6. 配置Nginx
```bash
cat > /etc/nginx/sites-available/college-admission << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/college-admission-query/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/college-admission /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 7. 配置防火墙
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 配置域名和HTTPS（可选）

### 购买域名
- 阿里云：https://wanwang.aliyun.com/
- 价格：.com ¥60/年，.cn ¥30/年

### 配置DNS解析
1. 进入"域名控制台"
2. 添加记录：
   - 类型: A
   - 主机记录: @
   - 记录值: 你的公网IP

### 安装SSL证书
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 常见问题

### Q: 如何查看应用日志？
```bash
# 后端日志
pm2 logs admission-backend

# Nginx日志
tail -f /var/log/nginx/college-admission-error.log
```

### Q: 如何重启服务？
```bash
# 重启后端
pm2 restart admission-backend

# 重启Nginx
systemctl restart nginx
```

### Q: 如何更新代码？
```bash
cd /var/www/college-admission-query
git pull origin main

# 更新后端
cd backend
npm install
npm run build
pm2 restart admission-backend

# 更新前端
cd ../frontend
npm install
npm run build
```

### Q: 网站打不开？
```bash
# 检查服务状态
systemctl status nginx
pm2 status

# 检查端口
netstat -tlnp | grep :80

# 检查防火墙
ufw status

# 检查阿里云安全组（在控制台确认开放80端口）
```

---

## 成本说明

### 轻量应用服务器
- 2核2GB：¥108/年
- 2核4GB：¥168/年
- 包含流量：1000-1500GB/月

### 额外费用
- 域名：¥10-60/年
- 流量超出：¥0.5-1/GB

### 总成本
- **最低**：¥118/年（服务器 + 域名）
- **推荐**：¥228/年（2核4GB + 域名）

---

## 维护命令

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 数据库备份
sudo -u postgres pg_dump admission_query > backup.sql

# 恢复数据库
sudo -u postgres psql admission_query < backup.sql
```

---

**详细文档**：[ALIYUN_DEPLOYMENT.md](./ALIYUN_DEPLOYMENT.md)

**祝部署顺利！** 🚀
