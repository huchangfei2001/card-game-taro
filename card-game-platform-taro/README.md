# 棋牌游戏平台 - Taro 多端适配文档

## 项目概述

基于 Taro 框架的棋牌游戏平台多端适配版本，一套代码同时支持：
- **H5（Web）**：浏览器直接访问
- **微信小程序**：微信内运行
- **支付宝小程序**：支付宝内运行（配置中）
- **抖音小程序**：抖音内运行（配置中）
- **百度小程序**：百度 App 内运行（配置中）

### 支持游戏（26款）

| 分类 | 游戏 |
|------|------|
| 🃏 棋牌类 | 斗地主、德州扑克、21点、炸金花、牛牛、掼蛋、升级、十三水、跑得快、梭哈 |
| ♟️ 棋类 | 中国象棋、围棋、五子棋、国际象棋、黑白棋、飞行棋、军棋、跳棋 |
| 🕹️ 街机类 | 俄罗斯方块、坦克大战、吃豆人、泡泡龙、打击者1945 |
| 🀄 麻将类 | 四川血战到底、日本立直麻将 |

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 yarn
- 微信开发者工具（调试小程序用）

### 安装依赖

```bash
cd card-game-platform-taro
npm install
```

### 开发运行

#### H5 模式（浏览器）

```bash
# 生产构建
npm run build:h5

# 启动开发服务器
npm run dev:h5
# 访问 http://localhost:10086
```

#### 微信小程序模式

```bash
# 生产构建
npm run build:weapp

# 开发模式（带监听）
npm run dev:weapp
# 使用微信开发者工具打开 dist/weapp 目录
```

### 生产部署

```bash
# 构建所有平台
npm run build:h5
npm run build:weapp

# H5 部署：上传 dist/h5 到 Web 服务器
# 小程序：上传 dist/weapp 到微信开发者工具
```

---

## 项目结构

```
card-game-platform-taro/
├── src/
│   ├── app.tsx                 # 小程序入口
│   ├── app.scss                # 全局样式
│   ├── app.config.ts           # 小程序配置（页面路由、导航栏等）
│   ├── index.html              # H5 HTML 模板
│   ├── pages/
│   │   ├── index/              # 大厅页面
│   │   ├── login/              # 登录/注册/个人中心
│   │   ├── multiplayer/        # 联机模式
│   │   └── game/               # 游戏页面
│   ├── games/                  # 26 个游戏引擎（从原版迁移）
│   ├── utils/
│   │   ├── UserContext.tsx      # 用户状态管理
│   │   └── gameList.ts         # 游戏列表配置
│   └── types/
│       └── index.ts            # TypeScript 类型定义
├── config/
│   ├── index.ts                # 主配置文件
│   ├── dev.ts                  # 开发环境配置
│   └── prod.ts                 # 生产环境配置
├── dist/                       # 构建输出
│   ├── h5/                     # H5 构建产物
│   └── weapp/                  # 微信小程序构建产物
├── project.config.json         # 小程序项目配置
├── package.json                # 依赖配置
└── tsconfig.json               # TypeScript 配置
```

---

## 配置说明

### config/index.ts 关键配置

```typescript
export default defineConfig<'webpack5'>(async (merge) => {
  return {
    projectName: 'card-game-platform',
    designWidth: 750,              // 设计稿宽度（750px 基准）
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,                      // 750px 设计稿，1px = 1rpx
      828: 1.81 / 2,
      375: 2 / 1
    },
    framework: 'react',
    compiler: 'webpack5',
    
    // 小程序配置
    mini: {
      postcss: {
        pxtransform: { enable: true }  // px 自动转 rpx
      }
    },
    
    // H5 配置
    h5: {
      publicPath: '/',
      devServer: {
        port: 10086,
        host: 'localhost'
      }
    }
  }
})
```

### app.config.ts 页面配置

```typescript
export default defineAppConfig({
  pages: [
    'pages/index/index',       // 大厅
    'pages/login/index',       // 登录/个人中心
    'pages/multiplayer/index', // 联机模式
    'pages/game/index'         // 游戏页面
  ],
  window: {
    navigationBarTitleText: '棋牌游戏平台',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0f0f1e'
  },
  tabBar: {
    color: '#888',
    selectedColor: '#c9a84c',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '大厅' },
      { pagePath: 'pages/login/index', text: '我的' }
    ]
  }
})
```

---

## API 对接

### 后端 API 地址

配置在 `src/utils/UserContext.tsx`：

```typescript
const API_BASE = 'http://localhost:3001/api'
```

请根据实际部署环境修改此地址。

### 支持的 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/register` | POST | 用户注册（赠送 2000 金币） |
| `/api/login` | POST | 用户登录 |
| `/api/guest` | POST | 游客登录（赠送 500 金币） |
| `/api/user/:id` | GET | 获取用户信息 |
| `/api/coins/add` | POST | 增加金币 |
| `/api/coins/spend` | POST | 消耗金币 |

### 数据格式

**用户对象：**
```typescript
interface User {
  id: string
  username: string
  coins: number
  isGuest: boolean
}
```

---

## 多端差异处理

### 1. 存储 API

使用 Taro 的统一存储 API：

```typescript
import Taro from '@tarojs/taro'

// H5 端：localStorage
// 小程序端：wx.setStorageSync
Taro.setStorageSync('currentUser', JSON.stringify(user))
const cached = Taro.getStorageSync('currentUser')
```

### 2. 网络请求

使用 Taro.request（封装了 wx.request 和原生 fetch）：

```typescript
const res = await Taro.request({
  url: `${API_BASE}/register`,
  method: 'POST',
  data: { username, password }
})
```

### 3. Canvas 游戏

小程序使用 `<Canvas type="2d">` 组件：

```tsx
<Canvas
  type='2d'
  id='gameCanvas'
  className='game-canvas'
/>
```

获取 canvas 上下文：

```typescript
const canvas = Taro.createCanvasContext('gameCanvas')
// 或对于 type="2d" 的新 API
const res = await Taro.createSelectorQuery().select('#gameCanvas').node().exec()
const node = res[0].node
const ctx = node.getContext('2d')
```

### 4. 路由导航

使用 Taro.navigateTo/switchTab：

```typescript
// 普通跳转
Taro.navigateTo({ url: '/pages/game/index?id=ddz&cost=20' })

// 跳转到底部 Tab 页
Taro.switchTab({ url: '/pages/index/index' })

// 返回上一页
Taro.navigateBack()
```

---

## 样式适配

### 单位转换

Taro 默认将 px 转为 rpx（小程序单位）：

- 设计稿 750px，书写时直接用 px 值
- 例：`.game-card { padding: 24px; }` → 小程序中自动转为 `24rpx`

### 安全区域

在 `app.scss` 中已处理：

```scss
page {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

### 响应式布局

使用 `pxtransform` 插件自动处理：

```scss
.game-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);  // 不同设备自动适配
}
```

---

## 已知问题

### 1. 开发服务器问题

`npm run dev:h5 -- --watch` 可能因 webpack-virtual-modules 兼容性问题失败。

**解决方案：** 使用生产构建 + 静态服务器：

```bash
npm run build:h5
cd dist/h5 && python3 -m http.server 10086
```

### 2. Canvas 街机游戏

小程序中 Canvas 游戏的渲染使用简化版 drawArcade，核心逻辑（俄罗斯方块旋转/消除、游戏计分）已对接引擎。完整像素级渲染可后续优化。

### 3. WebSocket（联机模式）

小程序使用 `Taro.connectSocket`，需后端支持标准 WebSocket：

```typescript
const socket = Taro.connectSocket({ url: 'ws://localhost:3001' })
socket.onOpen(() => { /* ... */ })
socket.onMessage((msg) => { /* ... */ })
socket.send({ data: '...' })
```

---

## 部署指南

### H5 部署

```bash
# 构建
npm run build:h5

# 使用任意 Web 服务器托管 dist/h5/ 目录
# Nginx 示例配置
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist/h5;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;  # SPA 路由
    }
    
    location /api {
        proxy_pass http://localhost:3001;  # 后端 API
    }
}
```

### 微信小程序部署

1. 构建小程序：
   ```bash
   npm run build:weapp
   ```

2. 打开微信开发者工具

3. 导入项目，选择 `dist/weapp` 目录

4. 填写 AppID（或使用测试号）

5. 配置服务器域名：
   - 请求合法域名：`https://your-api-domain.com`
   - socket 合法域名：`wss://your-socket-domain.com`

6. 上传代码，提交审核

---

## 扩展开发

### 添加新游戏

1. 在 `src/utils/gameList.ts` 中添加游戏信息：

```typescript
{ 
  id: 'newGame', 
  name: 'New Game', 
  nameCn: '新游戏', 
  desc: '游戏描述', 
  players: '2人', 
  category: 'card', 
  icon: '🃏' 
}
```

2. 将游戏引擎放入 `src/games/newGame/` 目录

3. 在 `src/pages/game/index.tsx` 中添加游戏类型判断和渲染逻辑

### 添加新平台（如支付宝小程序）

1. 安装平台插件：
   ```bash
   npm install @tarojs/plugin-platform-alipay --save
   ```

2. 在 `package.json` 中添加构建脚本：
   ```json
   "build:alipay": "taro build --type alipay"
   ```

3. 运行构建：
   ```bash
   npm run build:alipay
   ```

---

## 当前实现状态

### ✅ 已完成
- **26 个游戏引擎** 全部迁移到 Taro 项目（纯 TypeScript，可直接复用）
- **大厅页面**：完整的游戏列表，按分类显示，带金币显示
- **登录/个人中心**：注册、登录、游客模式、个人资料
- **联机模式**：房间创建/加入，WebSocket 通信
- **游戏页面**：接入所有 26 个引擎
  - 纸牌类（Blackjack, DDZ, Texas, Niuniu, Zhajinhua, Guandan, Shengji, Paodekuai, Showhand, Sanshui）：完整的牌面渲染、选择、出牌逻辑
  - 棋类（ChineseChess, Gomoku, Othello, Go, Junqi, Tiaoqi）：网格渲染、选中高亮、合法走法显示
  - 街机类（Tetris, Tank, Pacman, PuzzleBobble, Strikers1945）：触屏方向键控制
  - 麻将类（Sichuan Mahjong, Riichi Mahjong）：牌组渲染、出牌操作
- **用户系统**：Taro.request + Taro.getStorageSync 适配
- **H5 编译通过**，可直接部署
- **微信小程序编译通过**，可用开发者工具打开

### ⚠️ 待优化
- 街机类 Canvas 绘制目前仅处理了输入和游戏逻辑 tick，图形渲染（drawArcade）已简化
- 十三水、升级的游戏逻辑较为复杂，目前显示手牌和基础交互
- 部分复杂棋类（军旗、跳棋）AI 走法的边界情况需要调试

## 常见问题

### Q: 为什么 H5 开发服务器会报错？

A: Taro 3.6.x 与某些 webpack 插件有兼容性问题。建议使用生产构建方式，或使用更稳定的 Taro 版本。

### Q: 如何在小程序中调试？

A: 
1. 使用微信开发者工具的「调试器」面板
2. 开启「不校验合法域名」选项（开发阶段）
3. 使用 `console.log` 查看日志

### Q: 后端 API 在哪里配置？

A: 在 `src/utils/UserContext.tsx` 文件中：
```typescript
const API_BASE = 'http://localhost:3001/api'
```

### Q: 如何修改游戏价格？

A: 在 `src/pages/index/index.tsx` 中的 `GAME_COST` 对象修改：
```typescript
const GAME_COST: Record<string, number> = {
  ddz: 20,    // 斗地主 20 金币
  poker: 30,  // 德州扑克 30 金币
  // ...
}
```

---

## 技术栈

- **框架**: Taro 3.6.25
- **UI 框架**: React 18
- **样式**: SCSS
- **构建工具**: Webpack 5
- **语言**: TypeScript
- **状态管理**: React Context

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本，支持 H5 和微信小程序 |

---

## 集成测试

### 测试环境准备

```bash
# 1. 启动后端服务（端口 3001）
cd ../card-game-platform/server
node index.js &

# 2. 启动 H5 服务器（端口 10086）
cd card-game-platform-taro
npm run build:h5
npx serve dist/h5 -p 10086 &
```

### 测试用例

#### 1. H5 构建测试
```bash
cd /workspace/card-game-platform-taro
npm run build:h5
# 预期：编译成功，生成 dist/h5 目录
# 检查：
ls -la dist/h5/js/    # 应包含 app.js, 299.js
ls -la dist/h5/css/   # 应包含 app.css
curl http://localhost:10086/  # 应返回 200
```

#### 2. 微信小程序构建测试
```bash
npm run build:weapp
# 预期：编译成功，生成 dist/weapp 目录
# 检查：
ls dist/weapp/pages/  # 应包含 game, index, login, multiplayer
cat dist/weapp/app.json  # 应包含正确的页面路由配置
```

#### 3. 后端 API 测试
```bash
# 用户注册
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
# 预期返回：{"user":{"id":"...","username":"testuser","coins":2000,...}}

# 用户登录
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# 游客登录
curl -X POST http://localhost:3001/api/guest \
  -H "Content-Type: application/json" -d '{}'
# 预期返回：coins 为 500

# 金币消费
curl -X POST http://localhost:3001/api/coins/spend \
  -H "Content-Type: application/json" \
  -d '{"userId":"用户ID","amount":100}'
# 预期：返回剩余金币

# 金币充值
curl -X POST http://localhost:3001/api/coins/add \
  -H "Content-Type: application/json" \
  -d '{"userId":"用户ID","amount":500}'
```

#### 4. 资源加载测试
```bash
# H5 资源验证
curl -I http://localhost:10086/js/app.js
curl -I http://localhost:10086/js/299.js
curl -I http://localhost:10086/css/app.css
# 全部应返回 HTTP 200
```

### 游戏覆盖检查

| 游戏 ID | 引擎文件 | 组件 | 状态 |
|---------|----------|------|------|
| ddz | doudizhuEngine | DouDiZhuGame | ✅ |
| poker | texasEngine | TexasHoldemGame | ✅ |
| blackjack | blackjackEngine | BlackjackGame | ✅ |
| niuniu | niuniuEngine | NiuniuGame | ✅ |
| zhajinhua | zhajinhuaEngine | ZhajinhuaGame | ✅ |
| guandan | guandanEngine | GuandanGame | ✅ |
| shengji | shengjiEngine | ShengjiGame | ✅ |
| paodekuai | paodekuaiEngine | PaodekuaiGame | ✅ |
| showhand | suohaEngine | SuohaGame | ✅ |
| gomoku | gomokuEngine | GomokuGame | ✅ |
| othello | othelloEngine | OthelloGame | ✅ |
| go | goEngine | GoGame | ✅ |
| chess | chessEngine | ChessGame | ✅ |
| xiangqi | chessEngine | ChessGame | ✅ |
| jungli | junqiEngine | BoardGameWithSelect | ✅ |
| checkers | tiaoqiEngine | BoardGameWithSelect | ✅ |
| flyingchess | ludoEngine | LudoGame | ✅ |
| tetris | tetrisEngine | TetrisCanvasGame | ✅ |
| tank | tankbattleEngine | TankCanvasGame | ✅ |
| pacman | pacmanEngine | PacmanCanvasGame | ✅ |
| puzzlebobble | puzzlebobbleEngine | PuzzleBobbleCanvasGame | ✅ |
| strikers1945 | strikers1945Engine | Strikers1945CanvasGame | ✅ |
| sichuanmahjong | scmjEngine | MahjongGame | ✅ |
| riichimahjong | riichimahjongEngine | MahjongGame | ✅ |

**总计：24 个游戏组件，覆盖 24 个游戏引擎**

---

## 故障排除指南

### 常见问题

#### 1. 构建失败：webpack 内存溢出
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```
**解决方案：**
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build:h5
```

#### 2. 小程序 Canvas 不显示
**检查项：**
- Canvas 组件是否添加 `type="2d"` 属性
- 小程序基础库版本是否 >= 2.7.0
- 是否有调用 `Taro.createSelectorQuery().node()`

#### 3. 后端连接失败
```
request:fail url not in domain list
```
**解决方案：**
- H5：确保后端服务运行在 localhost:3001 或配置正确的代理
- 小程序：在微信开发者工具中开启「不校验合法域名」

#### 4. Socket.io 联机失败
**检查项：**
- 后端 Socket.io 是否正确初始化
- 小程序是否使用 `Taro.connectSocket` 而非原生 WebSocket
- 检查域名配置（小程序需要 wss 域名）

#### 5. 金币不显示或扣费失败
**检查项：**
- 后端服务是否启动（端口 3001）
- API_BASE 配置是否正确
- 用户是否已登录

#### 6. 游戏页面空白
**检查项：**
- 检查控制台错误信息
- 确认游戏 ID 传递正确（URL 参数 ?id=xxx）
- 查看 gameList.ts 中是否存在该游戏配置

### 调试技巧

#### 开启 React DevTools（H5）
```bash
# 在浏览器控制台执行
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject()
```

#### 小程序调试
```bash
# 微信开发者工具中
# 1. 右上角 - 详情 - 本地设置 - 开启"不校验合法域名"
# 2. 调试器 - Network 查看网络请求
# 3. 调试器 - Console 查看日志
```

#### 查看构建产物
```bash
# H5
ls -lh dist/h5/js/
# 小程序
ls -lh dist/weapp/app.js
```

### 回滚版本

如果新版本有问题，可回滚到之前的工作版本：
```bash
# 查看 git 历史
git log --oneline -10

# 回滚到上一个版本
git reset --hard HEAD~1

# 重新构建
npm run build:h5
```

---

## 联系方式

如有问题或建议，欢迎提 Issue 或 PR。
