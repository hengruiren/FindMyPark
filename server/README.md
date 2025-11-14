# FindMyPark NYC - 后端 API

Express.js 后端服务器，提供 FindMyPark NYC 应用的 RESTful API。

## 项目结构

```
server/
├── config/
│   └── database.js      # 数据库配置和连接
├── models/
│   ├── User.js          # 用户模型
│   ├── Park.js          # 公园模型
│   ├── Facility.js      # 设施模型
│   ├── Trail.js         # 步道模型
│   └── Review.js        # 评论模型
├── routes/
│   ├── parks.js         # 公园路由
│   ├── facilities.js    # 设施路由
│   ├── trails.js        # 步道路由
│   ├── reviews.js       # 评论路由
│   └── users.js         # 用户路由
├── server.js            # 服务器主文件
├── package.json         # 项目依赖
└── .env.example         # 环境变量示例
```

## 安装和运行

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置数据库连接信息：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=NewPassword123!
DB_NAME=findmypark_nyc
DB_PORT=3306
PORT=3000
```

### 3. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 端点

### 公园 (Parks)

- `GET /api/parks` - 获取公园列表
  - 查询参数: `name`, `borough`, `latitude`, `longitude`, `radius`, `limit`
- `GET /api/parks/:parkId` - 获取单个公园
  - 查询参数: `details=true` (包含设施和步道)
- `GET /api/parks/boroughs` - 获取所有区
- `GET /api/parks/stats` - 获取统计信息

### 设施 (Facilities)

- `GET /api/facilities` - 获取设施列表
  - 查询参数: `type`, `park_id`, `is_lighted`, `is_accessible`, `borough`, `limit`
- `GET /api/facilities/:facilityId` - 获取单个设施
- `GET /api/facilities/types` - 获取所有设施类型
- `GET /api/facilities/stats` - 获取统计信息

### 步道 (Trails)

- `GET /api/trails` - 获取步道列表
  - 查询参数: `park_id`, `difficulty`, `limit`
- `GET /api/trails/:trailId` - 获取单个步道
- `GET /api/trails/difficulties` - 获取所有难度级别
- `GET /api/trails/stats` - 获取统计信息

### 评论 (Reviews)

- `POST /api/reviews` - 创建评论
  - Body: `{ user_id, park_id?, facility_id?, rating, comment? }`
- `GET /api/reviews/:reviewId` - 获取单个评论
- `PUT /api/reviews/:reviewId` - 更新评论
- `DELETE /api/reviews/:reviewId` - 删除评论
- `GET /api/reviews/park/:parkId` - 获取公园评论
- `GET /api/reviews/facility/:facilityId` - 获取设施评论
- `GET /api/reviews/user/:userId` - 获取用户评论

### 用户 (Users)

- `POST /api/users/register` - 注册新用户
  - Body: `{ username, email, password }`
- `POST /api/users/login` - 用户登录
  - Body: `{ username, password }`
- `GET /api/users/:userId` - 获取用户信息
- `PUT /api/users/:userId` - 更新用户信息
- `DELETE /api/users/:userId` - 删除用户

### 其他

- `GET /` - API 信息
- `GET /health` - 健康检查

## 使用示例

### 搜索公园

```bash
# 按名称搜索
curl "http://localhost:3000/api/parks?name=Central&limit=10"

# 按区搜索
curl "http://localhost:3000/api/parks?borough=Manhattan&limit=20"

# 附近搜索
curl "http://localhost:3000/api/parks?latitude=40.7829&longitude=-73.9654&radius=2.0"
```

### 获取公园详情

```bash
# 基本信息
curl "http://localhost:3000/api/parks/park_id_123"

# 包含设施和步道
curl "http://localhost:3000/api/parks/park_id_123?details=true"
```

### 搜索设施

```bash
# 搜索篮球场
curl "http://localhost:3000/api/facilities?type=Basketball&limit=10"

# 搜索有灯光的网球场
curl "http://localhost:3000/api/facilities?type=Tennis&is_lighted=true"

# 搜索可访问的设施
curl "http://localhost:3000/api/facilities?is_accessible=true&borough=Manhattan"
```

### 创建评论

```bash
curl -X POST "http://localhost:3000/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "park_id": "park_id_123",
    "rating": 4.5,
    "comment": "Great park!"
  }'
```

### 用户注册

```bash
curl -X POST "http://localhost:3000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password"
  }'
```

## 技术栈

- **Node.js** - 运行环境
- **Express.js** - Web 框架
- **MySQL2** - MySQL 数据库驱动
- **bcryptjs** - 密码加密
- **CORS** - 跨域支持
- **dotenv** - 环境变量管理

## 注意事项

1. **密码安全**: 用户密码使用 bcrypt 进行哈希存储
2. **SQL 注入防护**: 所有查询使用参数化查询
3. **错误处理**: 包含完整的错误处理机制
4. **连接池**: 使用连接池管理数据库连接
5. **CORS**: 已启用 CORS，允许跨域请求

## 开发建议

1. 使用 `nodemon` 进行开发，自动重启服务器
2. 使用 Postman 或类似工具测试 API
3. 生产环境请使用环境变量管理敏感信息
4. 考虑添加 JWT 认证中间件保护需要认证的路由

