export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/multiplayer/index',
    'pages/game/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: '棋牌游戏平台',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0f0f1e',
    pageOrientation: 'auto'
  },
  tabBar: {
    color: '#888',
    selectedColor: '#c9a84c',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '大厅'
      },
      {
        pagePath: 'pages/login/index',
        text: '我的'
      }
    ]
  },
  requiredBackgroundModes: ['audio'],
  networkTimeout: {
    request: 10000,
    connectSocket: 10000,
    uploadFile: 10000,
    downloadFile: 10000
  }
})
