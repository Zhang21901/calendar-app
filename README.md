# 📅 日历本 — 个人计划管理系统

一个**简洁、交互性强**的个人日历应用，支持拖拽排期、AI 智能助手、数据可视化。

---

## 快速启动

### 前置要求
- Python 3.12+
- Node.js 18+
- npm

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt    # 首次运行需要
python -m uvicorn app.main:app --reload
```

后端运行在 `http://localhost:8000`，API 文档在 `http://localhost:8000/docs`。

### 2. 启动前端

打开**另一个终端**：

```bash
cd frontend
npm install                        # 首次运行需要
npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。

### 3. 配置 AI 功能（可选）

编辑 `backend/.env` 文件，填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

AI 助手将于下次重启后端后生效。

---

## 功能概览

| 功能 | 说明 |
|------|------|
| 📋 **任务池** | 左侧面板，存放所有未分配的任务 |
| 🖱️ **拖拽排期** | 从任务池拖到日历日期（Alt+拖=复制模板） |
| 📅 **月/周视图** | 月视图规划全局，周视图聚焦细节 |
| 📝 **便签纸日历** | 每天一张纸，完成度越高越透明，底部进度条 |
| ✏️ **日详情页** | 点击日历纸进入 — 24h 时间轴、进度滑块、计时器、备忘录 |
| ⏱️ **计时器** | 点▶开始计时→点■停止，自动记录实际耗时 |
| ⚠️ **特殊日** | 截止日/里程碑/休息日/自定义，发光边框 + 图标 |
| 📊 **数据中心** | 侧边抽屉 — 柱状图(每日工时)、热力图(完成度)、环形图(周/月率)、折线图(拖延趋势) |
| 🤖 **AI 助手** | 自然语言直接操作 — 创建任务、安排日程、标记完成、查询统计 |
| 🌙 **自动迁移** | 每天午夜未完成任务自动滚到今天并标记拖延次数 |
| 🎨 **6 种主题** | 蓝白 / 暖黄 / 绿植 × 亮色 / 暗色 |

---

## 快捷键

| 键 | 功能 |
|----|------|
| `T` | 回到月视图 |
| `D` | 切换暗色模式 |
| `Esc` | 退出日详情页 |
| `Enter` | AI 助手中发送指令 |

---

## 数据存储

所有数据存储在 `backend/calendar.db`（SQLite 文件），备份只需复制此文件。

---

## 项目结构

```
calendar-app/
├── backend/              # FastAPI + SQLite + DeepSeek API
│   ├── app/
│   │   ├── main.py       # 入口
│   │   ├── config.py     # 配置
│   │   ├── database.py   # 数据库
│   │   ├── models/       # ORM 模型
│   │   ├── schemas/      # Pydantic 模型
│   │   ├── routers/      # API 路由
│   │   ├── services/     # 业务逻辑 + AI Agent
│   │   └── utils/        # 日期工具 + 后台调度器
│   ├── requirements.txt
│   └── calendar.db       # SQLite 数据库（自动创建）
├── frontend/             # React + TypeScript + Vite
│   └── src/
│       ├── components/   # UI 组件
│       ├── context/      # React Context 状态管理
│       ├── api/          # API 调用层
│       ├── hooks/        # 自定义 Hooks
│       └── types/        # TypeScript 类型
└── .env                  # API Key 配置
```
