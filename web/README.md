# web（主前端应用）

无限画布的浏览器前端主体，纯前端应用（不假设存在项目后端），负责画布编排、独立生图/生视频/语音工作台、提示词库、素材库、应用配置、以及本地 Agent（Canvas Agent / Codex / Claude Code）聊天面板。

技术栈：Vite 7 + React 19 + React Router 7 + TypeScript + Ant Design 6 + Tailwind 4 + Zustand 5 + @tanstack/react-query + i18next（zh-TW / zh-CN / en-US，默认 zh-TW）+ localforage（IndexedDB 持久化）+ axios。

```bash
cd web
bun install
bun run dev
```

## 目录速览

```
web/src/
  pages/         路由页面
  components/    UI 组件（画布 / Agent / 提示词 / 布局 / 语音浮动面板 / 基础 ui）
  stores/        Zustand 全局状态（含 stores/canvas/）
  services/api/  外部服务封装（AI 生成接口、提示词源、WebDAV、本地 Agent 通讯）
  lib/           核心工具函数（含 lib/canvas/ 画布领域逻辑、lib/agent/ Agent 站内工具）
  hooks/         跨页面复用 hook
  layouts/       页面布局壳
  types/         关键类型定义（画布节点、插件契约等）
  i18n/          国际化资源与配置
  router.tsx     路由表
```

## 页面（`pages/`）

- **home**：产品首页，展示 CTA 与提示词精选。
- **canvas**：无限画布，分两部分：
  - `index.tsx` 画布项目管理页——新建 / 导入(zip) / 导出 / 删除项目。
  - `project.tsx` 画布编辑器主体（全应用最核心、最大的文件）——节点与连线的增删改、拖拽选中/框选、撤销重做历史栈、视口缩放平移、生成请求管理（AbortController 池）、复制粘贴、快捷键、分组吸附，并通过 `hooks/use-agent-bridge.ts`（画布快照↔`useAgentStore` 双向桥接）、`hooks/use-plugin-host.tsx`（为插件节点组装宿主能力、启动时 `ensurePluginsLoaded()`）对接 Agent 与插件系统。
- **image** / **video**：独立的文生图/图生图、文生视频/图生视频工作台（非画布模式），含参数面板、历史生成记录、资源库/提示词库联动、批量结果网格；video 额外支持 Seedance 系列专属参数与轮询式任务状态。
- **voice**：语音工作台路由入口（字幕辨识/翻译/配音三段式 Tab）；生产环境已改为 `components/voice-floating` 的画布内浮动面板，本页面主要保留为可视化骨架。
- **prompts**：提示词库浏览页，分类/标签/关键字过滤、分页加载、复制、加入素材库。
- **assets**：素材库管理（文本/图片/视频），CRUD、搜索筛选分页、导入导出打包。
- **config**：应用配置页，壳很薄，主体渲染 `components/layout/app-config-modal.tsx`（渠道 / 偏好 / 提示词源 / WebDAV / 本地存储 五个 Tab）。
- **not-found**：404 兜底页。

路由集中声明在 `router.tsx`（`createBrowserRouter`），所有业务页面共用 `layouts/user-layout.tsx`。

## 组件（`components/`）

- **canvas/**：画布编辑器全部 UI 构件——`infinite-canvas.tsx`（平移缩放手势容器）、`canvas-node.tsx`（节点卡片渲染，含插件内容注入）、`canvas-connections.tsx`（连线）、工具栏/顶栏/缩放/小地图、右键菜单与创建菜单、各类节点专属对话框（裁剪/蒙版/分割/放大/角度）、生成参数面板、`canvas-plugin-manager-modal.tsx`（插件管理 UI）、侧边栏（历史/素材/提示词）、`nodes/builtin-nodes.tsx`（内置节点类型注册）。
- **agent/**：本地 Agent 聊天面板全套 UI，见下文「本地 Agent 集成」。
- **prompts/**：提示词卡片、选择弹窗（供 image/video 工作台调用）、分页查询 hook。
- **voice-floating/**：语音工作台的画布内浮动面板（按钮 + 面板 + 独立 store `useVoicePanelStore`），仅在 `/canvas` 路由显示。
- **layout/**：应用级布局与配置——`app-providers.tsx`（AntD/ReactQuery/i18n 顶层包裹）、`app-top-nav.tsx`、`app-config-modal.tsx` 及其各 Tab 子组件（渠道编辑、模型脚本编辑器、提示词源管理、本地存储用量）、`client-root-init.tsx`（启动时处理 URL 直传配置、定时刷新提示词源）。
- **ui/**：基础视觉原子组件（下拉封装、主题切换动效、文字动效）。
- 根目录下还有独立工作台复用的设置面板：`image-settings-panel.tsx`、`video-settings-panel.tsx`、`text-settings-panel.tsx`、`audio-settings-panel.tsx`、`model-picker.tsx`。

## 状态（`stores/`）

| Store | 文件 | 管理内容 |
| --- | --- | --- |
| `useCanvasStore` | `stores/canvas/use-canvas-store.ts` | 画布项目列表持久化（IndexedDB） |
| `useCanvasUiStore` | `stores/canvas/use-canvas-ui-store.ts` | 画布列表页纯 UI 状态 |
| `usePluginStore` | `stores/canvas/use-plugin-store.ts` | 已安装画布插件清单 |
| `useAgentStore` | `stores/use-agent-store.ts` | 本地 Agent 面板全部状态（连接、聊天、线程、权限、canvasContext 等） |
| `useAgentSkillStore` | `stores/use-agent-skill-store.ts` | Codex Skills 加载/选中/草稿 |
| `useWorkbenchAgentStore` | `stores/use-workbench-agent-store.ts` | Agent 远程遥控独立工作台的命令队列与任务追踪 |
| `useAssetStore` | `stores/use-asset-store.ts` | 素材库（文本/图片/视频） |
| `useConfigStore` | `stores/use-config-store.ts` | AI 渠道、各能力默认模型、生成参数、WebDAV 等应用总配置 |
| `usePromptSourceStore` | `stores/use-prompt-source-store.ts` | 提示词源列表与刷新调度配置 |
| `useThemeStore` | `stores/use-theme-store.ts` | 明暗主题 |
| `useUserStore` | `stores/use-user-store.ts` | 极简本地用户信息（单机应用） |
| `useCanvasSidePanelStore` | `stores/use-canvas-side-panel-store.ts` | 画布侧边栏开合/宽度 |

## 服务（`services/api/`）

- `image.ts` / `video.ts` / `audio.ts`：图片生成/编辑/问答、视频生成任务创建与轮询、TTS 语音合成，均支持标准 OpenAI 风格接口与自定义模型脚本两条路径。
- `model-plugin.ts`：「模型脚本」运行时——用户为某模型编写自定义 JS 脚本以适配非标准供应商 API，通过注入的 `PluginHttp` 发起请求；**与画布节点插件是两套独立系统**，注意区分。
- `prompts.ts` / `prompt-source-presets.ts` / `prompt-source-runtime.ts`：提示词聚合服务，按用户启用的源分别拉取、本地缓存、合并去重。
- `canvas-agent.ts`：与本地 Agent HTTP 服务（默认 `http://127.0.0.1:17371`）通讯的全部端点封装。
- 根目录：`app-sync.ts`（画布/素材/生成日志等域数据的 WebDAV 打包同步）、`config-file.ts`（应用配置导出导入）、`file-storage.ts` / `image-storage.ts`（localforage 媒体二进制存储层）、`webdav-sync.ts`（WebDAV 协议客户端）、`local-storage-usage.ts`（IndexedDB 用量统计）。

## 核心工具（`lib/`）

### `lib/canvas/`（画布领域逻辑，插件系统核心）

- `node-registry.ts`：全局节点类型注册表，内置节点与插件节点统一登记，按 `pluginId` 归属以便整体卸载。
- `plugin-loader.ts`：插件安装/启用/禁用/卸载/更新总控，`Blob + dynamic import()` 安全执行插件源码；支持官方市场、任意 URL、本地 `public/plugins/index.json` 三种来源。
- `plugin-registry.ts`：官方插件市场清单拉取与 semver 升级判断。
- `plugin-runtime.ts` / `plugin-node-context.ts`：向插件注入宿主 React 实例、事件总线、CSS 注入，并为每个节点组装 `CanvasNodeContext`。
- `canvas-agent-ops.ts`：定义 `CanvasAgentOp` 指令集（add_node/update_node/delete_node/connect_nodes/select_nodes/set_viewport/run_generation）及执行器，是本地 Agent 远程操控画布的协议层。
- `canvas-event-bus.ts`：节点/插件间事件总线 + 按插件 ID 隔离的私有存储。
- `canvas-node-factory.ts` / `canvas-node-geometry.ts` / `canvas-node-size.ts` / `canvas-image-data.ts` / `canvas-generation-helpers.ts` / `canvas-resource-references.ts` / `canvas-export.ts`：节点创建、几何与尺寸计算、图像处理、生成请求辅助、资源引用与 @提及解析、画布导出打包。

### 其他

- `lib/agent/agent-site-tools.ts`：本地 Agent 可在浏览器端直接执行的「站内工具」（列出画布项目、查生成状态、读写独立工作台配置并触发生成、搜索提示词、素材增删），不经过后端转发。
- `lib/canvas-theme.ts` / `lib/app-theme.ts`：画布与 AntD 主题配色。
- `lib/zip.ts`：基于 fflate 的 zip 读写。
- `lib/localforage-storage.ts`：zustand persist 适配 localforage。
- 其余：`image-utils.ts`、`image-reference-prompt.ts`、`audio-generation.ts`、`seedance-video.ts`、`release.ts`、`keyboard-event.ts`、`utils.ts`、`analytics.ts`。

## 其他目录

- `hooks/`：`use-copy-text.ts`（复制+提示）、`use-prompt-source-scheduler.ts`（按源刷新间隔定时增量刷新提示词）、`use-version-check.ts`（版本更新检测）。
- `layouts/user-layout.tsx`：全站唯一布局壳——顶部导航 + 主内容区 + 常驻 `AgentPanel`（右侧滑出）+ 仅画布路由显示的语音浮动按钮。
- `i18n/`：i18next + react-i18next，三语言资源，持久化到 `localStorage`，默认 zh-TW。
- `types/canvas.ts`：画布核心类型（节点类型、`CanvasNodeData`、`CanvasNodeMetadata`、连线、视口、Agent 会话）。
- `types/canvas-plugin.ts`：插件 SDK 类型契约（`CanvasPlugin`/`CanvasNodeDefinition`/`CanvasNodeContext`/`CanvasPluginHost`/`CanvasPluginAi`），画布插件生态最重要的类型文件；变更时需同步 `plugins/canvas/sdk/src/types.ts`。
- `types/canvas-export.ts` / `types/image.ts` / `types/media.ts`：画布导出包结构、参考媒体引用类型。

## 画布节点插件系统在前端侧如何运作

1. **类型契约**：`types/canvas-plugin.ts` 定义插件包结构与节点定义接口。
2. **注册中心**：`lib/canvas/node-registry.ts` 统一登记内置节点（`components/canvas/nodes/builtin-nodes.tsx` 启动时 `registerBuiltinNodes()`）与插件节点。
3. **加载与生命周期**：`lib/canvas/plugin-loader.ts` 负责安装/启用/禁用/卸载/更新，元数据持久化在 `usePluginStore`；`pages/canvas/hooks/use-plugin-host.tsx` 在画布启动时调用 `ensurePluginsLoaded()` 完成自动加载。
4. **运行期宿主与渲染**：`plugin-runtime.ts` 注入宿主能力，`plugin-node-context.ts` 组装 `CanvasNodeContext`，实际渲染发生在 `components/canvas/canvas-node.tsx`。
5. **管理 UI**：`components/canvas/canvas-plugin-manager-modal.tsx` 提供市场浏览/URL安装/启用禁用/升级/卸载界面。

插件目录本身见 [`plugins/canvas/README.md`](../plugins/canvas/README.md)。

## 本地 Agent（Canvas Agent / Codex / Claude Code）集成

前端把本地 Agent 服务（默认 `http://127.0.0.1:17371`）当作 SSE + REST 后端对接：

- **状态层**：`useAgentStore`（连接/聊天/线程/权限/`canvasContext`）、`useAgentSkillStore`（Skills）、`useWorkbenchAgentStore`（远程遥控独立工作台）。
- **服务层**：`services/api/canvas-agent.ts` 封装状态上报、客户端激活、工具结果回传、审批决策、中断轮次、Skills 拉取/生成等端点。
- **画布桥接**：`pages/canvas/hooks/use-agent-bridge.ts` 打包画布快照发布到 store，并提供 `applyAgentOps` / `undoOps` 执行与撤销 Agent 下发的操作指令。
- **站内工具执行**：`lib/agent/agent-site-tools.ts` 让 Agent 直接在浏览器执行站内操作。
- **UI 层**（`components/agent/`）：`agent-panel.tsx`（右侧滑出容器）→ `local-agent-panel.tsx`（主逻辑，SSE 事件流解析、消息合并、附件上传、工具调用与审批）→ 聊天时间线、连接引导、历史线程、事件日志、Skills 浏览等子视图（`agent-panel-tabs.tsx` 五个 Tab 切换）。

本地 Agent 服务端实现见 [`canvas-agent/README.md`](../canvas-agent/README.md)。
