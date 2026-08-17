# 剪輯節點插件

Infinite Canvas 画布节点插件：时间轴片段裁剪节点，可设置开始/结束秒数并在进度条上高亮选中区间。

> 当前为视觉骨架版本（借鉴 SHUO-Canvas v0.7.5 设计），节点内「✂ 剪輯」按钮暂未接入真实裁剪 API，仅作占位提示；真实剪辑能力计划在后续版本接入。

## 构建

```bash
npm install
npm run build      # 产物 dist/lumen-clip.js，并同步到 web/public/plugins/lumen-clip.js
npm run dev         # watch
```

## 安装

画布 → 左上菜单「节点插件」→ 安装 URL 填 `/plugins/lumen-clip.js`（或托管后的公网 URL）。

插件契约见 `plugins/canvas/README.md`。
