#!/bin/bash

# 高考志愿填报系统 - 阿里云自动部署脚本
# 适用于 Ubuntu 20.04/22.04
# 使用方法: bash aliyun-deploy.sh

set -e  # 遇到错误立即退出

echo "========================================="
echo "高考志愿填报系统 - 阿里云自动部署"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root用户运行此脚本${NC}"
    exit 1
fi

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}服务器公网IP: ${SERVER_IP}${NC}"
echo ""

# 询问GitHub仓库地址
read -p "请输入GitHub仓库地址 (例如: https://github.com/username/repo.git): " GITHUB_REPO
if [ -z "$GITHUB_REPO" ]; then
    echo -e "${RED}仓库地址不能为空${NC}"
    exit 1
fi

# 数据库配置
DB_NAME="admission_query"
DB_USER="rainworm"
read -sp "请输入数据库用户密码: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}数据库密码不能为空${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}开始部署...${NC}"
echo ""

# 更新系统
echo -e "${GREEN}[1/10] 更新系统...${NC}"
apt update && apt upgrade -y

# 安装基础工具
echo -e "${GREEN}[2/10] 安装基础工具...${NC}"
apt install -y curl wget git vim unzip ufw

# 安装Node.js 18
echo -e "${GREEN}[3/10] 安装Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    echo "Node.js已安装: $(node -v)"
fi

# 安装PM2
echo -e "${GREEN}[4/10] 安装PM2...${NC}"
npm install -g pm2

# 安装PostgreSQL
echo -e "${GREEN}[5/10] 安装PostgreSQL 14...${NC}"
if ! command -v psql &> /dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt update
    apt install -y postgresql-14 postgresql-contrib-14
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "PostgreSQL已安装"
fi

# 配置数据库
echo -e "${GREEN}[6/10] 配置数据库...${NC}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo "数据库已配置"

# 安装Nginx
echo -e "${GREEN}[7/10] 安装Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "Nginx已安装"
fi

# 克隆项目
echo -e "${GREEN}[8/10] 克隆项目代码...${NC}"
mkdir -p /var/www
cd /var/www

if [ -d "college-admission-query" ]; then
    echo "项目目录已存在，正在更新..."
    cd college-admission-query
    git pull origin main
else
    echo "正在克隆仓库..."
    git clone $GITHUB_REPO college-admission-query
    cd college-admission-query
fi

# 部署后端
echo -e "${GREEN}[9/10] 部署后端...${NC}"
cd /var/www/college-admission-query/backend

# 创建.env文件
cat > .env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://$SERVER_IP

# 登录认证配置
ACCESS_PASSWORD=your_secure_password_here
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
EOF

echo ""
echo -e "${YELLOW}⚠️  重要提示：${NC}"
echo "   - 已自动生成 JWT 密钥"
echo "   - 默认访问密码为: your_secure_password_here"
echo "   - 部署后请立即修改密码："
echo "     vim /var/www/college-admission-query/backend/.env"
echo ""

# 安装依赖
npm install

# 生成Prisma客户端
npx prisma generate

# 推送数据库结构
npx prisma db push

# 构建项目
npm run build

# 启动后端
pm2 delete admission-backend 2>/dev/null || true
pm2 start dist/server.js --name "admission-backend"
pm2 save

# 部署前端
echo -e "${GREEN}[10/10] 部署前端...${NC}"
cd /var/www/college-admission-query/frontend

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_URL=http://$SERVER_IP:3000
EOF

# 安装依赖
npm install

# 构建前端
npm run build

# 配置Nginx
echo -e "${GREEN}配置Nginx...${NC}"
cat > /etc/nginx/sites-available/college-admission << EOF
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /var/www/college-admission-query/frontend/dist;
        try_files \$uri \$uri/ /index.html;
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

    # 日志
    access_log /var/log/nginx/college-admission-access.log;
    error_log /var/log/nginx/college-admission-error.log;
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/college-admission /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 重新加载Nginx
systemctl reload nginx

# 配置防火墙
echo -e "${GREEN}配置防火墙...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# 安装Python（用于数据导入）
echo -e "${GREEN}安装Python环境（用于数据导入）...${NC}"
apt install -y python3 python3-pip
pip3 install openpyxl psycopg2-binary python-dotenv

echo ""
echo "========================================="
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "========================================="
echo ""
echo "📝 重要信息："
echo "   - 服务器IP: $SERVER_IP"
echo "   - 访问地址: http://$SERVER_IP"
echo "   - 数据库名: $DB_NAME"
echo "   - 数据库用户: $DB_USER"
echo ""
echo "📊 下一步：导入数据"
echo "   1. 在本地运行以下命令上传Excel文件："
echo "      scp D:\\Vscode\\高考志愿填报\\22-25年全国高校在浙江的专业录取分数.xlsx root@$SERVER_IP:/tmp/"
echo ""
echo "   2. SSH到服务器，运行导入脚本："
echo "      cd /var/www/college-admission-query/scripts"
echo "      python3 import-excel.py"
echo ""
echo "🔧 常用命令："
echo "   - 查看后端日志: pm2 logs admission-backend"
echo "   - 重启后端: pm2 restart admission-backend"
echo "   - 查看Nginx日志: tail -f /var/log/nginx/college-admission-error.log"
echo "   - 重启Nginx: systemctl restart nginx"
echo ""
echo "📖 详细文档: ALIYUN_DEPLOYMENT.md"
echo ""
echo "========================================="
