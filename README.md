# E-Judge.AI 高校学生职务数智评判系统 (新生开源独立版)

欢迎查阅 E-Judge.AI 学生职务数智评判系统独立开源工程！本项目面向高校学生骨干选拔、答辩模拟与综合素质评价研发，采用双轨解耦评判架构与五维量化评价体系。

---

## 快速上手与本地运行

本工程基于纯前端轻量化技术栈开发（Vite + React 18 + TypeScript + Tailwind CSS），无需配置后端数据库，解压后即可本地启动。

### 1. 环境准备
确保电脑已安装 Node.js（推荐 v18 或更高版本）。

### 2. 安装依赖
在项目根目录下打开终端，执行以下命令安装依赖包：

```bash
npm install
```

### 3. 启动开发服务器
执行以下命令启动本地预览：

```bash
npm run dev
```

终端将输出本地服务地址（通常为 `http://localhost:5173`），在浏览器中打开即可开始体验与调试。

### 4. 生产环境构建
若需打包静态文件：

```bash
npm run build
```

打包生成的文件位于 `dist/` 目录，可直接托管至任意静态网页平台（如 Vercel、GitHub Pages、Netlify 等）。

---

## 工程目录结构说明

```
sixhomework/
├── public/                 # 静态资源（像素小组件、徽章、PDF解析器脚本）
│   ├── images/badges/      # 田园复古风格胜任力徽章
│   ├── images/icons/       # 像素风格卷轴、羽毛笔、法球组件
│   └── pdfjs/              # 离线 PDF 提取引擎 (pdf.js)
├── src/
│   ├── components/         # 通用 UI 组件
│   │   ├── Header.tsx      # 顶部状态导航栏
│   │   ├── Sidebar.tsx     # 左侧可收起垂直导航栏
│   │   ├── MetricStars.tsx # 五维档位星级指示器
│   │   └── views/          # 九大业务功能核心视窗
│   │       ├── ArchiveView.tsx     # [01] 评判名册总表与分项档案
│   │       ├── ParallelAgentLab.tsx# [02] 多智能体并行协作控制大厅
│   │       ├── TasksView.tsx       # [03] 申报材料MinerU版面解析与任务流水
│   │       ├── CodexView.tsx       # [04] 岗位标准库与五维规则配比
│   │       ├── BenchView.tsx       # [05] 复核仲裁法庭与人工改判留痕
│   │       ├── WorkshopView.tsx    # [06] 模拟面试试炼工坊与STAR即时评分
│   │       ├── GrowthView.tsx      # [07] 因材施教发展规划与育人建议单
│   │       ├── ExportView.tsx      # [08] 数据凭据导出与防伪溯源水印
│   │       └── TestsView.tsx       # [09] 40份样本对照基准鲁棒性测试
│   ├── data/               # 岗位预设规则与脱敏候选人数据集 (mockData.ts)
│   ├── services/           # 核心算法引擎
│   │   ├── mineruLayoutParser.ts # MinerU 版面解析与表格结构还原
│   │   ├── pdfExtractor.ts       # 浏览器端真实 PDF 文本坐标抽取
│   │   ├── subAgentSystem.ts     # 多智能体并行调度与双评仲裁系统
│   │   └── audioEngine.ts        # 田园复古 Web Audio 实时音效
│   ├── types/              # 核心数据模型与类型定义
│   ├── App.tsx             # 顶层状态编排与事件总线
│   └── main.tsx            # 应用挂载入口
├── package.json            # 依赖项与启动脚本配置
└── vite.config.ts          # Vite 打包配置
```

---

## 核心设计亮点

1. **双轨解耦评判架构**：大模型独立承担离散胜任档位判别，核心评分程序依据既定权重计算总分，杜绝数值漂移。
2. **纯前端离线运行**：PDF 提取、版面解析、五维打分与音频合成全部在浏览器端本地完成，零数据泄露风险。
3. **STAR即时响应评估**：在模拟面试试炼工坊中，只要改动任意文字，系统即时重算并在0.1秒内同步更新总分、档位徽章与四色雷达进度条。
4. **一页纸因材施教发展单**：将评判结果延伸至育人链条，自动诊断胜任力缺口，匹配专属进阶行动建议。
