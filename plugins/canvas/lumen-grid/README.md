# 宮格節點插件

Infinite Canvas 画布节点插件：按提示词批量生成 N×M 分镜宫格的骨架节点，可设置行数、列数与提示词，并把提示词以文本资源形式暴露给下游节点。

> 当前为视觉骨架版本（借鉴 SHUO-Canvas v0.7.5 设计），节点内「✨ 生成 R×C」按钮暂未接入真实批量生成 API，仅作占位提示；真实能力计划在后续版本接入。

## 构建

```bash
npm install
npm run build      # 产物 dist/lumen-grid.js，并同步到 web/public/plugins/lumen-grid.js
npm run dev         # watch
```

## 安装

画布 → 左上菜单「节点插件」→ 安装 URL 填 `/plugins/lumen-grid.js`（或托管后的公网 URL）。

插件契约见 `plugins/canvas/README.md`。
