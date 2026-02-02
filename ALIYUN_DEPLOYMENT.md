# 高考志愿填报系统 - 阿里云部署指南

本指南将帮助您将高考志愿填报系统部署到阿里云，实现公网访问。

## 部署架构

- **服务器**: 阿里云轻量应用服务器 或 ECS
- **操作系统**: Ubuntu 22.04 / 20.04 LTS
- **数据库**: PostgreSQL 14
- **后端**: Node.js 18 + Express
- **前端**: Vite构建的静态文件
- **Web服务器**: Nginx (反向代理 + 静态文件服务)
- **进程管理**: PM2

---

## 方案选择

### 方案一：轻量应用服务器（推荐新手）

**优点**：
- 价格便宜：¥108-168/年（2核2G）
- 配置简单：预装环境，一键部署
- 自带流量包：每月1000GB-2000GB
- 适合个人项目和小型应用

**适用场景**：
- 个人博客、小型Web应用
- 学习和测试
- 低流量网站（日访问<5000人）

**配置推荐**：
- CPU: 2核
- 内存: 2GB
- 存储: 40GB SSD
- 带宽: 4Mbps（包含1000GB/月流量）
- 价格: ¥108/年（新用户优惠）

### 方案二：云服务器ECS（推荐生产环境）

**优点**：
- 更强大的配置选项
- 弹性伸缩
- 更好的性能和稳定性
- 适合企业级应用

**适用场景**：
- 生产环境
- 高流量应用
- 需要弹性扩展

**配置推荐**：
- 实例规格: 2核4GB (ecs.t6-c1m2.large)
- 操作系统: Ubuntu 22.04 64位
- 存储: 40GB ESSD
- 带宽: 5Mbps（按使用量付费）
- 价格: 约¥200-300/年

---

## 部署步骤（轻量应用服务器）

### 第一步：购买服务器

#### 1.1 访问阿里云轻量应用服务器
https://www.aliyun.com/product/swas

#### 1.2 选择配置
1. **地域**：选择距离你用户近的区域
   - 华东（杭州/上海）- 推荐
   - 华北（北京/青岛）
   - 华南（深圳）

2. **套餐**：
   - 2核2GB内存 - ¥108/年（推荐入门）
   - 2核4GB内存 - ¥168/年（推荐）

3. **镜像**：
   - 选择 "Ubuntu 22.04" 或 "Ubuntu 20.04"
   - 不要选择应用镜像（Node.js等），我们手动安装

4. **购买时长**：建议1年（有优惠）

5. **数量**：1台

6. 点击"立即购买"并完成支付

#### 1.3 获取服务器信息
购买成功后，在控制台可以看到：
- **公网IP**: 如 `47.97.123.45`
- ** root密码**: 点击"重置密码"设置
- **用户名**: `root`

**记录这些信息！** 后续连接服务器需要用到。

---

### 第二步：连接服务器

#### 2.1 安装SSH客户端
- **Windows**: 使用PowerShell或安装PuTTY
- **Mac/Linux**: 使用终端

#### 2.2 使用SSH连接

**Windows PowerShell**:
```powershell
ssh root@你的公网IP
# 例如: ssh root@47.97.123.45
```

输入你设置的root密码，登录成功后应该看到：
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-76-generic x86_64)

root@iZbp1jxxxxx:~#
```

#### 2.3 连接成功后的准备工作
```bash
# 更新系统
apt update && apt upgrade -y

# 设置时区为上海
timedatectl set-timezone Asia/Shanghai

# 安装基础工具
apt install -y curl wget git vim
```

---

### 第三步：安装Node.js

```bash
# 使用NodeSource仓库安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证安装
node -v   # 应该显示 v18.x.x
npm -v    # 应该显示 9.x.x 或更高
```

---

### 第四步：安装PostgreSQL数据库

#### 4.1 安装PostgreSQL
```bash
# 添加PostgreSQL官方仓库
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

# 安装PostgreSQL 14
apt update
apt install -y postgresql-14 postgresql-contrib-14

# 启动PostgreSQL服务
systemctl start postgresql
systemctl enable postgresql

# 验证安装
systemctl status postgresql
```

#### 4.2 配置数据库

**创建数据库和用户**：
```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL命令行中执行：
CREATE DATABASE admission_query;
CREATE USER rainworm WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE admission_query TO rainworm;
\q
```

**修改PostgreSQL配置允许远程连接**（可选）：
```bash
# 编辑配置文件
vim /etc/postgresql/14/main/postgresql.conf

# 找到并修改这行（去掉注释）：
listen_addresses = '*'

# 编辑pg_hba.conf
vim /etc/postgresql/14/main/pg_hba.conf

# 在文件末尾添加：
host    all             all             0.0.0.0/0               md5

# 重启PostgreSQL
systemctl restart postgresql
```

**配置防火墙**：
```bash
# 允许PostgreSQL端口（如果需要远程连接）
ufw allow 5432/tcp
```

---

### 第五步：安装Nginx

```bash
# 安装Nginx
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx

# 验证安装
systemctl status nginx
```

现在在浏览器访问你的服务器IP，应该看到Nginx欢迎页面：
```
http://你的公网IP
```

---

### 第六步：安装PM2（进程管理）

```bash
# 全局安装PM2
npm install -g pm2

# 验证安装
pm2 -v
```

---

### 第七步：部署后端应用

#### 7.1 克隆项目代码

```bash
# 安装git（如果还没有）
apt install -y git

# 克隆你的GitHub仓库
cd /var/www
git clone https://github.com/你的用户名/college-admission-query.git

# 进入项目目录
cd college-admission-query
```

#### 7.2 配置后端环境变量

```bash
cd backend

# 创建.env文件
cat > .env << 'EOF'
# 数据库连接
DATABASE_URL=postgresql://rainworm:your_strong_password@localhost:5432/admission_query

# 服务器配置
NODE_ENV=production
PORT=3000

# CORS配置
CORS_ORIGIN=http://your-ip-or-domain
EOF

# 将上面的密码替换为你设置的密码
```

#### 7.3 安装依赖并构建

```bash
# 安装依赖
npm install

# 生成Prisma客户端
npx prisma generate

# 推送数据库结构
npx prisma db push

# 构建TypeScript
npm run build
```

#### 7.4 导入数据

**方法1: 本地上传Excel文件到服务器**

在本地Windows电脑：
```powershell
# 使用SCP上传Excel文件
scp D:\Vscode\高考志愿填报\22-25年全国高校在浙江的专业录取分数.xlsx root@你的服务器IP:/var/www/college-admission-query/
```

然后在服务器上：
```bash
# 安装Python和依赖
apt install -y python3 python3-pip
pip3 install openpyxl psycopg2-binary python-dotenv

# 运行导入脚本
cd /var/www/college-admission-query/scripts
python3 import-excel.py
```

**方法2: 使用Git LFS（推荐）**

在GitHub仓库中启用Git LFS并提交Excel文件。

#### 7.5 使用PM2启动后端

```bash
# 返回backend目录
cd /var/www/college-admission-query/backend

# 使用PM2启动
pm2 start dist/server.js --name "admission-backend"

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行输出的命令

# 查看日志
pm2 logs admission-backend

# 查看状态
pm2 status
```

#### 7.6 测试后端API

```bash
# 在服务器上测试
curl http://localhost:3000/health

# 应该返回: {"status":"ok"}
```

如果正常，现在可以通过服务器IP访问：
```
http://你的公网IP:3000/health
```

---

### 第八步：部署前端应用

#### 8.1 构建前端

```bash
cd /var/www/college-admission-query/frontend

# 配置API地址
cat > .env.production << 'EOF'
VITE_API_URL=http://你的公网IP:3000
EOF

# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，静态文件在 `dist` 目录。

#### 8.2 配置Nginx

```bash
# 创建Nginx配置文件
cat > /etc/nginx/sites-available/college-admission << 'EOF'
server {
    listen 80;
    server_name 你的公网IP或域名;

    # 前端静态文件
    location / {
        root /var/www/college-admission-query/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 日志
    access_log /var/log/nginx/college-admission-access.log;
    error_log /var/log/nginx/college-admission-error.log;
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/college-admission /etc/nginx/sites-enabled/

# 删除默认配置（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重新加载Nginx
systemctl reload nginx
```

#### 8.3 配置防火墙

```bash
# 允许HTTP
ufw allow 80/tcp

# 允许HTTPS（稍后配置SSL后需要）
ufw allow 443/tcp

# 允许SSH（确保不会锁自己）
ufw allow 22/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

#### 8.4 测试前端

现在在浏览器访问：
```
http://你的公网IP
```

应该能看到高考志愿填报系统首页！

---

### 第九步：配置域名和HTTPS（可选但推荐）

#### 9.1 购买域名
在阿里云购买域名：https://wanwang.aliyun.com/

价格示例：
- `.com`: 约¥60/年
- `.cn`: 约¥30/年
- `.top`: 约¥10/年

#### 9.2 配置DNS解析

1. 进入阿里云"域名控制台"
2. 点击你的域名
3. 添加DNS记录：
   - 记录类型: `A`
   - 主机记录: `@`（根域名）或 `www`
   - 记录值: 你的公网IP
   - TTL: 600（10分钟）

4. 等待DNS生效（通常10分钟）

#### 9.3 安装SSL证书（Let's Encrypt免费证书）

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 为域名申请证书（替换为你的域名）
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 按提示输入邮箱并同意条款

# Certbot会自动配置Nginx
```

证书会自动续期，也可以测试：
```bash
certbot renew --dry-run
```

#### 9.4 强制HTTPS（可选）

编辑Nginx配置：
```bash
vim /etc/nginx/sites-available/college-admission
```

在server块中添加：
```nginx
# 重定向HTTP到HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    # SSL配置（Certbot已自动添加）
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... 其他配置
}
```

重新加载Nginx：
```bash
systemctl reload nginx
```

---

### 第十步：配置自动部署（可选）

#### 10.1 使用Webhook自动更新

创建一个简单的部署脚本：

```bash
# 创建部署脚本
cat > /var/www/college-admission-query/deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/college-admission-query

# 拉取最新代码
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

# 重新加载Nginx
systemctl reload nginx

echo "部署完成！"
EOF

# 添加执行权限
chmod +x /var/www/college-admission-query/deploy.sh
```

当有新代码推送到GitHub时，SSH到服务器运行：
```bash
cd /var/www/college-admission-query
./deploy.sh
```

---

## 维护和管理

### 查看应用日志

```bash
# PM2日志（后端）
pm2 logs admission-backend

# Nginx访问日志
tail -f /var/log/nginx/college-admission-access.log

# Nginx错误日志
tail -f /var/log/nginx/college-admission-error.log

# 系统日志
journalctl -u nginx -f
```

### 重启服务

```bash
# 重启后端
pm2 restart admission-backend

# 重启Nginx
systemctl restart nginx

# 重启PostgreSQL
systemctl restart postgresql
```

### 监控服务器资源

```bash
# 查看CPU和内存使用
htop

# 或使用top
top

# 查看磁盘使用
df -h

# 查看数据库大小
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('admission_query'));"
```

### 数据库备份

**创建备份脚本**：
```bash
cat > /var/www/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump admission_query > $BACKUP_DIR/admission_query_$DATE.sql

# 保留最近7天的备份
find $BACKUP_DIR -name "admission_query_*.sql" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/admission_query_$DATE.sql"
EOF

chmod +x /var/www/backup-db.sh
```

**手动备份**：
```bash
/var/www/backup-db.sh
```

**自动备份（每天凌晨2点）**：
```bash
# 添加到crontab
crontab -e

# 添加这行：
0 2 * * * /var/www/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 故障排查

### 问题1: 无法访问网站

**检查项**：
```bash
# 1. 检查Nginx是否运行
systemctl status nginx

# 2. 检查端口是否开放
netstat -tlnp | grep :80

# 3. 检查防火墙
ufw status

# 4. 检查阿里云安全组（在阿里云控制台）
# 确保开放了80、443端口
```

### 问题2: 后端API请求失败

**检查项**：
```bash
# 1. 检查PM2进程
pm2 status

# 2. 查看后端日志
pm2 logs admission-backend

# 3. 测试后端API
curl http://localhost:3000/health

# 4. 检查环境变量
cat /var/www/college-admission-query/backend/.env
```

### 问题3: 数据库连接失败

**检查项**：
```bash
# 1. 检查PostgreSQL状态
systemctl status postgresql

# 2. 测试连接
sudo -u postgres psql -U rainworm -d admission_query

# 3. 检查数据库日志
tail -f /var/log/postgresql/postgresql-14-main.log
```

### 问题4: 内存不足

**解决方案**：
```bash
# 创建swap文件
dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 成本总结

### 轻量应用服务器（推荐）

| 配置 | 价格 | 带宽 |
|------|------|------|
| 2核2GB | ¥108/年 | 4Mbps + 1000GB/月 |
| 2核4GB | ¥168/年 | 5Mbps + 1500GB/月 |
| 2核8GB | ¥298/年 | 6Mbps + 2000GB/月 |

### 额外费用

- 域名: ¥10-60/年
- 流量超出: ¥0.5-1/GB
- 升级配置: 按需付费

### 预估总成本

- **最低配置**: ¥118/年（服务器 + 域名）
- **推荐配置**: ¥228/年（2核4GB + 域名）

---

## 性能优化建议

### 1. 数据库优化

编辑 `postgresql.conf`:
```bash
vim /etc/postgresql/14/main/postgresql.conf

# 添加/修改以下配置（根据2GB内存调整）
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# 重启PostgreSQL
systemctl restart postgresql
```

### 2. Nginx优化

```bash
vim /etc/nginx/nginx.conf

# 添加在http块中：
# 工作进程数（等于CPU核心数）
worker_processes auto;

# 连接数
events {
    worker_connections 2048;
}

# 启用gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
```

### 3. Node.js优化

使用PM2集群模式：
```bash
# 启动集群模式（使用所有CPU核心）
pm2 start dist/server.js -i max --name "admission-backend"

# 保存配置
pm2 save
```

---

## 安全加固

### 1. 配置防火墙

```bash
# 只允许必要的端口
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. 禁用root远程登录

```bash
# 创建新用户
adduser deploy
usermod -aG sudo deploy

# 配置SSH密钥（在本地电脑）
ssh-keygen -t rsa -b 4096
ssh-copy-id deploy@你的服务器IP

# 禁用密码登录和root登录
vim /etc/ssh/sshd_config

# 修改：
PasswordAuthentication no
PermitRootLogin no

# 重启SSH
systemctl restart sshd
```

### 3. 安装fail2ban（防暴力破解）

```bash
apt install -y fail2ban

# 创建配置
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

systemctl start fail2ban
systemctl enable fail2ban
```

---

## 监控和告警

### 使用阿里云云监控

1. 进入阿里云"云监控控制台"
2. 创建监控大盘
3. 添加监控项：
   - CPU使用率
   - 内存使用率
   - 磁盘使用率
   - 网络流量
   - 系统负载

4. 设置告警规则：
   - CPU > 80%
   - 内存 > 85%
   - 磁盘 > 90%

---

## 扩容方案

当流量增长时，可以：

1. **垂直扩展**：升级服务器配置
   - 2核2GB → 2核4GB → 4核8GB

2. **水平扩展**：
   - 使用阿里云负载均衡（SLB）
   - 部署多台服务器
   - 使用云数据库RDS PostgreSQL

3. **CDN加速**：
   - 使用阿里云CDN加速静态资源
   - 提升访问速度

---

## 快速部署清单

- [ ] 购买阿里云轻量应用服务器
- [ ] SSH连接到服务器
- [ ] 安装Node.js 18
- [ ] 安装PostgreSQL 14
- [ ] 安装Nginx
- [ ] 安装PM2
- [ ] 克隆项目代码
- [ ] 配置后端环境变量
- [ ] 安装依赖并构建后端
- [ ] 导入数据库数据
- [ ] 使用PM2启动后端
- [ ] 构建前端
- [ ] 配置Nginx反向代理
- [ ] 配置防火墙
- [ ] 测试网站访问
- [ ] （可选）购买并配置域名
- [ ] （可选）安装SSL证书
- [ ] （可选）配置自动备份

---

## 需要帮助？

- **阿里云文档**: https://help.aliyun.com/
- **Ubuntu文档**: https://ubuntu.com/server/docs
- **Nginx文档**: https://nginx.org/en/docs/
- **PostgreSQL文档**: https://www.postgresql.org/docs/

---

**祝部署顺利！** 🚀

如有问题，请查看"故障排查"部分或查阅相关文档。
