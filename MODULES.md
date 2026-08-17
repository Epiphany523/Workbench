# 模块地图（Modules）

本文件是「无限画布 (infinite-canvas)」仓库的模块索引，用于快速了解项目由哪些部分组成、各部分职责边界，以及去哪个模块的文档看详情。面向开发者/AI 协作，不替代 [README.md](README.md)（项目介绍）与 [docs/](docs/)（面向用户的文档站）。

## 项目是什么

无限画布是一款面向 AI 图片/视频创作的开源工作台：把**画布编排**、**AI 生图/生视频/参考图编辑**、**对话式本地 Agent**、**提示词库**、**素材库**放在同一个界面里。前端直连用户自己配置的 OpenAI 兼容接口，AI API Key 与所有项目数据默认只存在浏览器本地（可选 WebDAV 跨设备同步）；不存在必须依赖的项目后端。

## 仓库结构总览

```
Workbench/
  web/                 主前端应用（Vite + React，浏览器里跑的全部业务逻辑）
  desktop/             Windows 桌面客户端（Electron 壳，打包 web/ 产物为可安装 exe）
  canvas-agent/         本地 Agent 服务（连接画布网页与本机 Codex / Claude Code）
  plugins/
    canvas/             画布节点插件集合（sdk、registry、内置/官方插件各一个目录）
    infinite-canvas/     Codex app 插件（让 Codex 一键打开并操作画布）
  docs/                 面向用户的文档站（Fumadocs / Next.js，部署到 canvas.best 文档域）
  assets/               README/文档用的静态图片（赞助商 logo 等）
  Dockerfile / docker-compose*.yml / nginx.conf / render.yaml / vercel.json  部署配置
  AGENTS.md             AI/自动化开发行为约束（开发前必读）
  CHANGELOG.md / VERSION  版本记录
```

## 模块一览

| 模块 | 路径 | 一句话说明 | 详情文档 |
| --- | --- | --- | --- |
| 主前端应用 | `web/` | 画布编辑器、独立生图/生视频/语音工作台、提示词库、素材库、应用配置、Agent 聊天面板；纯前端，无必需后端 | [web/README.md](web/README.md) |
| Windows 桌面客户端 | `desktop/` | Electron 壳，把 `web/` 构建产物打包成可安装的 Windows exe；本地 Agent 仍需手动连接，与浏览器版一致 | [desktop/README.md](desktop/README.md) |
| 本地 Agent 服务 | `canvas-agent/` | Node/TS 编写的本机小服务，把画布网页与本机 Codex / Claude Code 连起来，通过 MCP 暴露画布操作工具 | [canvas-agent/README.md](canvas-agent/README.md) |
| 画布插件系统 | `plugins/canvas/` | 画布节点插件的开发规范、SDK、官方插件构建/发布注册表，以及各官方插件源码 | [plugins/canvas/README.md](plugins/canvas/README.md) |
| 插件 SDK | `plugins/canvas/sdk/` | 给插件作者的 TypeScript SDK：类型、automatic JSX、构建助手，让插件只需写节点 UI/逻辑 | [plugins/canvas/sdk/README.md](plugins/canvas/sdk/README.md) |
| 官方插件注册表 | `plugins/canvas/registry/` | CI 集中构建所有官方插件并发布到孤儿分支 `plugins-dist`，供画布经 jsDelivr 拉取安装 | [plugins/canvas/registry/README.md](plugins/canvas/registry/README.md) |
| 官方插件：Markdown / SVG / HTML / 3D 全景 / 便利贴 | `plugins/canvas/{markdown,svg,html,panorama,sticky-note}/` | 内置六种节点（文本/图片/视频/音频/生成配置/组）之外的扩展节点 | 各目录 `README.md` |
| Lumen 系列插件（宫格 / 拼图 / 剪辑） | `plugins/canvas/{lumen-grid,lumen-collage,lumen-clip}/` | 借鉴 SHUO-Canvas 设计的三个视觉骨架插件，交互已就位但生成/合成/裁剪 API 尚为占位，计划后续接入 | 各目录 `README.md` |
| 插件模板 | `plugins/canvas/template/` | 新插件起步模板，复制即可开始开发 | [plugins/canvas/template/README.md](plugins/canvas/template/README.md) |
| Codex app 插件 | `plugins/infinite-canvas/` | Codex app 市场插件，安装后可一键让 Codex 打开并连接画布 | [plugins/infinite-canvas/README.md](plugins/infinite-canvas/README.md) |
| 用户文档站 | `docs/` | Fumadocs/Next.js 文档站源码（快速开始、功能介绍、部署、画布操作手册等面向用户内容） | [docs/README.md](docs/README.md)、[docs/index.md](docs/index.md) |

## 模块之间如何协作

- **前端 ↔ AI 供应商**：`web/` 里的 `services/api/`（image/video/audio + `model-plugin.ts` 自定义脚本）直接从浏览器请求用户配置的 OpenAI 兼容接口，不经过任何本项目后端。
- **前端 ↔ 画布插件**：`web/` 的 `lib/canvas/plugin-loader.ts` 在运行时通过 `Blob + dynamic import()` 加载 `plugins/canvas/*` 构建产物（`dist/<id>.js`，同步到 `web/public/plugins/`），插件与宿主之间的契约由 `plugins/canvas/sdk` 与 `web/src/types/canvas-plugin.ts` 共同定义，两处类型需保持同步。
- **前端 ↔ 本地 Agent**：`canvas-agent/` 作为本机常驻服务，通过 HTTP/SSE 与 `web/` 的 `services/api/canvas-agent.ts` + `useAgentStore` 通讯；`canvas-agent/` 同时把自己注册为 MCP 服务器，供 Codex / Claude Code 终端通过工具调用（`canvas_apply_ops` 等）操作当前打开的画布。
- **Codex app ↔ 本地 Agent**：`plugins/infinite-canvas/`（Codex app 插件）安装后会启动/连接 `canvas-agent`，读取其输出的本机地址与 token，在 Codex 侧打开画布网页。
- **桌面壳 ↔ 前端**：`desktop/` 把 `web/` 构建产物原样加载进 Electron 窗口（生产环境用 `--base ./` 单独构建一份相对路径版本），不复制、不改前端逻辑；本地 Agent 连接方式与浏览器版一致。

## 文档维护约定

- 各模块的功能说明维护在模块自己的 `README.md` 里（就近原则，改代码时顺手更新）；本文件只做索引与模块间协作关系，不重复模块内部细节。
- 面向用户的产品功能说明、快速开始、部署等内容维护在 `docs/content/docs/`（Fumadocs 内容目录），与本文件的开发者/AI 向内容分开维护，避免重复。
- 项目整体开发规范与 AI 协作约束见 [AGENTS.md](AGENTS.md)。
