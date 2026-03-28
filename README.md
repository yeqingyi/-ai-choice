# AI Choice 🤔

> 智能选择式问答助手 - 通过选择题让AI回答更精准

## ✨ 特点

- **减少二次输入**：用选择题代替手动输入偏好
- **智能分析**：AI自动识别问题的关键维度
- **精准回答**：根据用户选择生成定制化答案
- **简单交互**：点选即可，无需打字

## 🎯 解决的问题

传统AI问答的问题：
- 用户问"山西旅游攻略"
- AI回答太泛，包含所有景点类型
- 用户需要追问"我更喜欢山水风光"
- 浪费时间，体验不好

**AI Choice 的方案**：
- 用户问"山西旅游攻略"
- AI分析后显示选项：🏔️山水、🏛️古建、🍜美食、🎭文化...
- 用户点选偏好
- AI给出精准推荐

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/ai-choice.git
cd ai-choice
```

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 配置 API Key

创建 `.env` 文件：

```bash
echo "OPENAI_API_KEY=your-api-key-here" > .env
```

### 4. 启动服务

```bash
npm start
```

访问 http://localhost:3000

## 📁 项目结构

```
ai-choice/
├── frontend/           # 前端页面
│   ├── index.html      # 主页面
│   ├── style.css       # 样式
│   └── app.js          # 交互逻辑
├── backend/            # 后端API
│   ├── server.js       # Express服务
│   ├── package.json    # 依赖配置
│   └── .env            # API密钥（需自己创建）
└── README.md
```

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML + CSS + Vanilla JS |
| 后端 | Node.js + Express |
| AI | OpenAI GPT-4o-mini |
| 部署 | 可部署到 Vercel + Render |

## 💡 使用示例

### 旅游类

```
问题：山西旅游攻略
选择：🏔️山水风光 + 🍜地道美食
答案：五台山、壶口瀑布、平遥古城美食街推荐...
```

### 学习类

```
问题：怎么学编程
选择：📱移动开发 + 🎯快速上手
答案：推荐Flutter入门路线、视频教程资源...
```

### 生活类

```
问题：周末北京去哪玩
选择：🌳户外 + 👨‍👩‍👧亲子
答案：奥林匹克森林公园、北京动物园、朝阳公园...
```

## 🎨 界面截图

（待添加）

## 📝 开发计划

- [ ] 支持多轮对话
- [ ] 添加历史记录页面
- [ ] 支持语音输入
- [ ] 部署线上版本
- [ ] 添加更多AI模型选项

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT