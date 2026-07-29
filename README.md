# 🃏 棋牌游戏平台

基于 Taro 框架的多端棋牌游戏平台，一套代码支持 H5 和微信小程序。

## 🎮 支持游戏（24款）

| 分类 | 游戏 |
|------|------|
| 🃏 棋牌 | 斗地主、德州扑克、21点、炸金花、牛牛、掼蛋、升级、跑得快、梭哈 |
| ♟️ 棋类 | 中国象棋、围棋、五子棋、国际象棋、黑白棋、飞行棋、军棋、跳棋 |
| 🕹️ 街机 | 俄罗斯方块、坦克大战、吃豆人、泡泡龙、打击者1945 |
| 🀄 麻将 | 四川血战到底、日本立直麻将 |

## 🚀 快速开始

```bash
# 进入项目
cd card-game-platform-taro

# 安装依赖
npm install

# 构建 H5
npm run build:h5
# 访问 http://localhost:10086

# 构建微信小程序
npm run build:weapp
```

## 📁 项目结构

```
card-game-platform-taro/    # Taro 多端项目
├── src/
│   ├── pages/              # 页面（大厅、登录、游戏）
│   ├── games/              # 24 个游戏引擎
│   └── utils/              # 工具函数
└── dist/                   # 构建产物
    ├── h5/                 # H5 部署文件
    └── weapp/              # 微信小程序
```

## 📖 文档

详细文档见 [card-game-platform-taro/README.md](card-game-platform-taro/README.md)

## 🔧 技术栈

- Taro 3.6.25 + React 18
- TypeScript + Webpack 5
- Socket.io 联机对战

## 📄 许可证

MIT
