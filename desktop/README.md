# desktop（Windows 桌面客户端）

用 Electron 把 `web/` 的前端产物包成 Windows 桌面程序（可安装 exe）。窗口壳只负责加载现有 web 应用，不复制、不改前端业务逻辑；本地 Agent（`canvas-agent/`）连接方式和浏览器版一致，仍需手动启动。

## 目录

```
desktop/
  src/main.ts              主进程：建窗口、单实例锁、外链跳转系统浏览器、SPA 404 回退首页
  scripts/build-renderer.mjs  用 web/ 的 vite 以相对路径(base "./")构建，产物复制到 renderer/
  scripts/generate-icon.mjs   一次性：从 web/public/logo.svg 生成 build/icon.ico
  build/icon.ico           应用图标（已提交，通常不需要重新生成）
```

## 开发

```bash
# 终端 A：先起 web 的 dev server（3000 端口）
cd web
npm run dev

# 终端 B：起 Electron 窗口，指向上面的 dev server
cd desktop
npm install
npm run dev
```

## 打包 Windows 安装包

```bash
cd desktop
npm install
npm run dist:win
```

产物在 `desktop/release/` 下（NSIS 安装包）。打包时会先用 `web/` 的 `vite build --base ./ --outDir dist-desktop` 单独构建一份相对路径版本（不影响常规部署用的 `web/dist`），再复制进 `desktop/renderer/` 一并打进安装包。

## 图标

图标由 `web/public/logo.svg` 生成，仅在图标变更时手动重跑：

```bash
cd desktop
npm run icon
```

产物 `build/icon.ico` 需要提交进 git。

## 已知范围

- 不内嵌/自动拉起 `canvas-agent`，桌面版启动流程与浏览器版一致，见 [canvas-agent/README.md](../canvas-agent/README.md)。
- 仅 Windows 目标（`electron-builder --win`），未做代码签名与自动更新。
