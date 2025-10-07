# Robot Controller Mobile

一个基于 React + Vite 的移动端机器人遥控应用，提供直观的触控操作界面，用于远程控制机器人的移动和转向。

## 功能特性

- **十字方向控制**：触控式方向控制面板，支持前进、后退、左转、右转
- **速度控制**：可调节最大速度（0-100 HZ），支持快速预设（30/50/70/100）
- **电源管理**：一键开关机器人电源
- **旋转控制**：支持左转90°、右转90°、掉头（180°）
- **阻尼调节**：滑块阻尼速度可调（0.2x-1.0x）
- **实时日志**：显示最近10条操作日志，包含响应状态和耗时
- **响应式设计**：适配移动端设备

## 技术栈

- **框架**：React 18.3.1
- **构建工具**：Vite 6.3.5
- **UI 组件库**：Radix UI
- **样式**：Tailwind CSS
- **图标**：Lucide React
- **语言**：TypeScript

## 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动，并自动打开浏览器。

### 生产构建

```bash
npm run build
```

构建产物将输出到 `build/` 目录。

## API 配置

### 开发环境

开发环境使用 Vite 代理转发 API 请求到机器人后端服务器：

- **代理地址**：`http://192.168.8.179:8080`
- **配置文件**：`vite.config.ts`

```typescript
proxy: {
  '/api': {
    target: 'http://192.168.8.179:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}
```

### 生产环境

生产环境使用 Nginx 反向代理，配置文件：`nginx.conf`

- **前端端口**：80
- **后端代理**：`/api/` → `http://127.0.0.1:8080`

## API 接口

### 电源控制

- `GET /api/robot/start/0` - 开机
- `GET /api/robot/stop/0` - 关机

### 运动控制

- `GET /api/robot/forward/{speed}` - 前进
- `GET /api/robot/reverse/{speed}` - 后退
- `GET /api/robot/turn_left/{speed}` - 左转
- `GET /api/robot/turn_right/{speed}` - 右转
- `GET /api/robot/pause/{speed}` - 停止

**参数说明**：
- `speed`：速度值，范围 0-100（单位：HZ）

## 使用说明

### 基本操作

1. **开机**：点击右上角电源按钮（蓝色表示已开机）
2. **方向控制**：触摸十字方向盘控制机器人移动
3. **速度设置**：
   - 拖动速度滑块调节最大速度
   - 点击预设按钮快速设置（30/50/70/100 HZ）
4. **旋转操作**：点击左转90°、右转90°或掉头按钮
5. **阻尼调节**：调整滑块阻尼以改变触控灵敏度

### 注意事项

- 必须先开机才能发送控制指令
- 关机后会自动停止机器人运动
- 旋转操作会在指定时间后自动停止（左右转3秒，掉头6秒）
- 日志显示最近10条操作记录，前3条高亮显示

## 项目结构

```
robot-controller-mobile/
├── src/
│   ├── App.tsx                    # 主应用组件
│   ├── components/                # UI 组件
│   │   ├── CrossDirectionPad.tsx  # 十字方向控制组件
│   │   ├── DraggableSlider.tsx    # 可拖拽滑块组件
│   │   └── ui/                    # Radix UI 组件封装
│   ├── services/
│   │   └── robotApi.ts            # 机器人 API 服务
│   ├── styles/
│   │   └── globals.css            # 全局样式
│   ├── main.tsx                   # 应用入口
│   └── index.css                  # 入口样式
├── build/                         # 构建输出目录
├── nginx.conf                     # Nginx 配置
├── vite.config.ts                 # Vite 配置
├── package.json                   # 项目依赖
└── README.md                      # 项目文档
```

## SSH 远程部署

项目已配置 SSH 连接到远程服务器：

- **服务器 IP**：192.168.8.179
- **端口**：22
- **用户名**：root
- **认证方式**：密码认证

配置文件位置：`.idea/sshConfigs.xml`

## 设计来源

本项目基于 Figma 设计：https://www.figma.com/design/rE3e3PYPiM0CrL0Uj3k1uM/Mobile-Screen-Version

## License

Private
