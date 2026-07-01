# 城市孤独地图 — 产品 Web 应用方案计划（执行版）

## 一、Summary

将项目升级为**可交互、可体验的 HTML5 单页 Web 应用**，参加 TRAE AI 创造力大赛初赛（截止 2026-07-15）。核心形态为：用户打开浏览器即用，无需下载安装；基于真实地理位置查看并标记城市情绪，调用 DeepSeek 大模型 API 完成情绪分析。

**产品定位**：基于真实地理位置的匿名城市情绪观察与低压力连接平台。

**核心体验闭环**：
1. 用户打开网页 → 授权获取真实定位（失败则默认上海）。
2. 在 Leaflet 真实城市地图上看到附近情绪标记（种子数据 + 自己新增）。
3. 点击标记查看情绪档案、匿名留言、AI 分析。
4. 用户自己标记情绪并留言 → 调用 DeepSeek API 分析情绪类型与建议。
5. 基于用户标记数据生成个人城市孤独报告。

---

## 二、Current State Analysis

### 2.1 文件结构（已模块化）

```
D:\map_demo\city-loneliness-map/
├── index.html                    # 入口，引入 Leaflet、CSS、JS 模块
├── css/
│   ├── base.css                  # CSS 变量、字体、重置、粒子动画
│   ├── components.css            # 按钮、卡片、模态框、表单组件
│   ├── sections.css              # Hero、地图、档案、AI 体验、报告等区块
│   └── responsive.css            # 响应式适配
├── js/
│   ├── app.js                    # 入口：初始化粒子、地图、UI、报告
│   ├── config.js                 # DeepSeek API Key / URL / 应用名配置
│   ├── map.js                    # Leaflet 地图、定位、标记渲染、附近筛选
│   ├── data.js                   # localStorage 数据层、种子数据、工具函数
│   ├── emotionAI.js              # DeepSeek AI 情绪分析 + 本地兜底响应
│   ├── ui.js                     # UI 交互：档案、表单、AI 体验、聊天、小纸条
│   └── report.js                 # 报告弹窗交互（当前为静态，需接入真实数据）
├── _shared/
│   ├── fonts/                    # Tektur / Outfit / GeistMono
│   └── js/echarts.min.js         # 图表库（报告模块待接入）
└── assets/                       # 氛围配图
```

### 2.2 功能实现状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 结构重构 | ✅ 已完成 | 已从单文件拆分为 index.html + css/ + js/ |
| 粒子背景 | ✅ 已完成 | app.js 中实现 |
| 导航/Hero/功能介绍 | ✅ 已完成 | 页面结构完整 |
| Leaflet 真实地图 | ✅ 已完成 | CartoDB Dark Matter 主题、缩放控件、定位按钮 |
| 真实地理定位 | ✅ 已完成 | navigator.geolocation，失败回退上海 |
| 情绪标记渲染 | ✅ 已完成 | 按孤独指数大小和透明度渲染发光标记 |
| 标记点击 → 档案联动 | ✅ 已完成 | map.js → ui.js renderProfile |
| localStorage 数据层 | ✅ 已完成 | checkins / notes / profile 读写 |
| 种子数据 | ✅ 已完成 | 上海/北京/广州/深圳/成都 共 12 个地点 |
| 新增情绪标记表单 | ✅ 已完成 | 地点名、感受、指数、标签，提交后持久化 |
| DeepSeek AI 情绪分析 | ✅ 已完成 | emotionAI.js 已接入，支持 JSON 解析与本地兜底 |
| 小纸条 | ✅ 已完成 | 查看/发布/持久化 |
| 附近的人 | ✅ 已完成 | 基于真实距离计算，从种子+用户数据筛选 |
| 聊天模拟 | ✅ 已完成 | 低压力共鸣对话模拟 |
| 城市孤独报告 | ⚠️ 部分完成 | 弹窗 UI 已存在，但内容仍为静态，需接入真实数据 |

### 2.3 待完成关键项

1. **报告模块数据化**：将 report.js 从静态报告升级为基于 `getUserProfile()` 和 `getCheckins()` 动态生成。
2. **API Key 管理说明**：在 config.js / README 中明确 DeepSeek Key 的注入方式与安全提示。
3. **边界处理**：localStorage 禁用、定位完全失败、DeepSeek API 失败/无 Key 时的降级体验。
4. **本地测试**：多浏览器、移动端响应式、地图瓦片加载稳定性。
5. **部署**：选择 GitHub Pages / Cloudflare Pages / Vercel 并验证公开链接。

---

## 三、Proposed Changes

### 3.1 报告模块动态化（report.js）

**目标**：点击"生成我的城市孤独报告"后，弹窗内容基于用户真实标记数据渲染。

**具体改动**：
- 在 `report.js` 中新增 `generateReportData()`：
  - 读取 `getUserProfile()` 和 `getCheckins()`。
  - 统计用户标记数、孤独类型分布、平均孤独指数。
  - 按情绪类型聚合，生成报告图表数据。
- 修改 `index.html` 中报告模态框的静态数字和图表为动态渲染。
- 引入 `_shared/js/echarts.min.js` 绘制情绪类型分布柱状图（可选，保持简单也可用 CSS 条形图）。
- 提供"无数据时"的友好空状态文案，引导用户先标记情绪。

**文件**：
- `js/report.js`：重写报告生成逻辑。
- `index.html`：调整报告模态框结构，预留动态容器。

### 3.2 AI 情绪分析配置与安全提示

**目标**：明确 DeepSeek API Key 的注入方式，避免用户误提交密钥到仓库。

**具体改动**：
- 保持 `js/config.js` 中 `DEEPSEEK_API_KEY` 为空字符串。
- 在 `index.html` 底部或弹窗中增加一处"配置 API Key"入口（仅本地演示使用）。
- 在 `config.js` 注释中强化安全提示："生产环境请通过后端代理注入，勿将 Key 提交到公开仓库"。

**文件**：
- `js/config.js`：完善注释。
- `js/emotionAI.js`：保持现有实现，已支持 API 失败回退本地演示响应。

### 3.3 边界与异常处理

**目标**：提升 demo 稳定性，避免关键路径因环境差异卡死。

**具体改动**：
- `map.js` 定位失败时已有默认回退上海，补充用户提示（toast 或按钮状态）。
- `data.js` 中 localStorage 读写已包 try/catch，补充"localStorage 被禁用时降级为内存存储"开关。
- `emotionAI.js` 无 Key 或 API 失败时自动使用本地 demoResponses，保持体验连贯。
- 新增"重置体验数据"按钮，方便评审反复体验。

**文件**：
- `js/data.js`：增加 `isStorageAvailable()` 与内存降级。
- `js/ui.js`：增加重置数据按钮绑定。
- `js/map.js`：定位状态提示优化。

### 3.4 本地测试清单

1. 桌面 Chrome / Edge / Firefox 打开 `index.html`（建议用 Live Server）。
2. 允许定位：地图中心应移动到真实位置附近；拒绝定位：回退到上海人民广场。
3. 点击"标记此刻"或地图空白处，填写表单提交，地图新增标记，刷新后标记仍在。
4. 在 AI 体验区输入不同情绪文本，观察返回结果是否符合语义（需先填入 DeepSeek Key）。
5. 小纸条发布与刷新持久化。
6. 生成报告：有用户数据时显示真实统计，无数据时显示引导文案。
7. 手机浏览器打开，检查地图高度、面板滚动、按钮可点击。

### 3.5 部署方案

**推荐**：GitHub Pages（免费、与仓库绑定、国内可访问）或 Cloudflare Pages。

**部署步骤**：
1. 将 `city-loneliness-map/` 目录推送到 GitHub 仓库（仓库可为公开）。
2. 在仓库 Settings → Pages 中选择分支和根目录。
3. 等待构建完成，获取 `https://<username>.github.io/<repo>/city-loneliness-map/index.html` 类似链接。
4. 在中国大陆网络下访问验证：页面加载、地图瓦片、DeepSeek API（若 Key 有效）。

**注意**：
- 不要提交包含真实 API Key 的 `config.js`；部署前用环境变量替换或保持为空。
- 如 OpenStreetMap / CartoDB 瓦片加载慢，可准备高德瓦片回退（需临时申请 Key）。

---

## 四、技术选型

| 层级 | 选型 | 原因 |
|------|------|------|
| 地图引擎 | Leaflet.js + CartoDB Dark Matter | 免费、无 Key、深色主题匹配 UI |
| 定位 API | navigator.geolocation | 浏览器原生，用户授权即可 |
| 数据持久化 | localStorage | 零后端，适合快速 demo |
| AI 情绪分析 | DeepSeek-V3 / DeepSeek-Chat | 用户已确认，中文情绪理解好 |
| 图表 | ECharts（已引入）或 CSS 条形图 | 报告模块可视化 |
| 部署 | GitHub Pages / Cloudflare Pages | 免费静态托管 |

---

## 五、开发任务拆分（剩余）

### 阶段 1：报告模块动态化
- 修改 `js/report.js`：接入真实用户数据，生成报告内容。
- 调整 `index.html` 报告模态框：静态内容改为动态容器。
- 用 ECharts 或 CSS 绘制情绪分布图。

### 阶段 2：边界处理与体验优化
- `js/data.js`：增加 localStorage 禁用时的内存降级。
- `js/ui.js`：增加"重置体验数据"按钮。
- `js/map.js`：优化定位失败的用户提示。

### 阶段 3：API Key 与安全提示
- `js/config.js`：完善注释与安全提示。
- 可选：在 UI 中增加临时 Key 输入入口（本地演示用）。

### 阶段 4：本地测试
- 桌面多浏览器测试。
- 移动端响应式测试。
- 验证有/无 DeepSeek Key 时的降级体验。

### 阶段 5：部署与验证
- 推送到 GitHub / Cloudflare Pages。
- 获取公开链接。
- 验证中国大陆访问、定位、新增标记、AI 分析、报告生成。

---

## 六、Assumptions & Decisions

1. **Web 应用形态**：用户已确认采用浏览器单页应用，不使用小程序或 App。
2. **真实地图**：使用 Leaflet + CartoDB Dark Matter，而非高德/百度（避免申请 Key）。
3. **AI 模型**：用户已确认使用 DeepSeek，API Key 由用户提供，Demo 阶段临时配置在前端。
4. **无后端**：使用 localStorage 降低复杂度，符合大赛时间限制。
5. **不实现真实 IM**：附近的人聊天为模拟共鸣对话，聚焦核心情绪体验。
6. **单页无路由**：所有功能在一个页面完成，便于快速部署。

---

## 七、Verification Steps

1. 打开公开链接，页面加载正常，粒子背景、Hero、导航显示正确。
2. 允许定位后地图中心移动到真实位置；拒绝定位回退上海。
3. 地图上可见多个情绪标记，点击后右侧面板显示对应档案。
4. 点击"标记此刻"或地图空白处，填写表单提交，新标记出现；刷新后仍存在。
5. 填入 DeepSeek API Key 后，AI 体验区输入情绪文本，返回符合语义的分析。
6. 未填 Key 或 API 失败时，AI 体验区仍能返回本地兜底结果。
7. 小纸条发布后可刷新持久化。
8. 生成报告时，弹窗显示基于用户真实数据的统计与建议；无数据时显示引导。
9. 手机浏览器打开，响应式布局正常，地图与面板可正常交互。
10. 公开链接在中国大陆网络环境下可正常访问。

---

## 八、风险与应对

| 风险 | 应对 |
|------|------|
| OpenStreetMap / CartoDB 访问慢 | 准备高德瓦片回退方案 |
| 浏览器定位失败 | 默认定位上海，提供手动选择城市（未来可扩展） |
| localStorage 被禁用 | 降级为内存存储，并提示用户 |
| DeepSeek API Key 未提供或失效 | 自动使用本地 demoResponses，体验不中断 |
| 14 天工期紧张 | 优先完成 P0：报告动态化、边界处理、部署验证 |

---

## 九、MVP 优先级

**P0（必须完成）**：
- 报告模块动态化（基于真实用户数据）
- 边界处理与降级体验
- 部署并验证公开链接

**P1（强烈建议）**：
- API Key 配置入口与安全提示
- 本地多浏览器/移动端测试

**P2（有余力再做）**：
- 更多城市种子数据
- 报告页 ECharts 图表美化
- 抖音人气通道视频素材准备

---

## 十、参赛帖素材准备

开发过程中需保留：
- 至少 3 个关键 TRAE 对话的 Session ID。
- 至少 3 张 TRAE 开发关键步骤截图。
- 已通过的报名帖链接。
- 最终 Demo 公开访问链接。
