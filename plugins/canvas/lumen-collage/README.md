# 拼圖節點插件

Infinite Canvas 画布节点插件：多图拼图节点，支持格子 / 长条 / 瀑布三种布局切换，格子区域按图片数量自适应占位。

> 当前为视觉骨架版本（借鉴 SHUO-Canvas v0.7.5 设计），节点内「✨ 拼圖」按钮暂未接入真实拼图合成 API，也未实现从上游图片节点自动取图，仅作占位展示；真实能力计划在后续版本接入。

## 构建

```bash
npm install
npm run build      # 产物 dist/lumen-collage.js，并同步到 web/public/plugins/lumen-collage.js
npm run dev         # watch
```

## 安装

画布 → 左上菜单「节点插件」→ 安装 URL 填 `/plugins/lumen-collage.js`（或托管后的公网 URL）。

插件契约见 `plugins/canvas/README.md`。
