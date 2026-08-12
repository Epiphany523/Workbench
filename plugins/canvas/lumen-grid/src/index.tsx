// Lumen Canvas 宮格節點（借鑑 SHUO-Canvas v0.7.5 宮格節點）
// 用法：連接文字提示詞 + 圖片參考，自動生成 N×M 宮格
// v0.7.4 為視覺骨架；v0.7.5 串接真實 API
import { definePlugin } from "@infinite-canvas/plugin-sdk";
import type { CanvasNodeContentProps } from "@infinite-canvas/plugin-sdk";

function GridContent({ ctx }: CanvasNodeContentProps) {
    const rows = Number(ctx.node.metadata?.rows) || 2;
    const cols = Number(ctx.node.metadata?.cols) || 3;
    const cells = rows * cols;
    const images: string[] = (ctx.node.metadata?.images as string[]) || [];
    const prompt = (ctx.node.metadata?.prompt as string) || "";

    const updateMeta = (patch: Record<string, unknown>) =>
        ctx.updateMetadata(patch);

    return (
        <div
            data-canvas-no-zoom
            onMouseDown={(e) => e.stopPropagation()}
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 12,
                boxSizing: "border-box",
                color: ctx.theme.node.text,
                fontFamily: "system-ui, sans-serif",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>提示詞:</span>
                <input
                    value={prompt}
                    placeholder="輸入宮格提示詞..."
                    onChange={(e) => updateMeta({ prompt: e.target.value })}
                    style={{
                        flex: 1,
                        border: `1px solid ${ctx.theme.node.stroke}`,
                        background: "transparent",
                        color: ctx.theme.node.text,
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                    }}
                />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 11, opacity: 0.7 }}>
                    行 <input type="number" min={1} max={6} value={rows} onChange={(e) => updateMeta({ rows: Number(e.target.value) })} style={{ width: 40, marginLeft: 4, marginRight: 8, background: "transparent", color: ctx.theme.node.text, border: `1px solid ${ctx.theme.node.stroke}`, borderRadius: 3, padding: "0 4px" }} />
                </label>
                <label style={{ fontSize: 11, opacity: 0.7 }}>
                    列 <input type="number" min={1} max={6} value={cols} onChange={(e) => updateMeta({ cols: Number(e.target.value) })} style={{ width: 40, marginLeft: 4, background: "transparent", color: ctx.theme.node.text, border: `1px solid ${ctx.theme.node.stroke}`, borderRadius: 3, padding: "0 4px" }} />
                </label>
                <button
                    type="button"
                    onClick={() => alert("v0.7.5 將串接真實宮格生成 API")}
                    style={{
                        marginLeft: "auto",
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "#8B2845",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 11,
                    }}
                >
                    ✨ 生成 {rows}×{cols}
                </button>
            </div>
            <div
                style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: 4,
                    background: "rgba(0,0,0,0.04)",
                    borderRadius: 6,
                    padding: 4,
                    minHeight: 0,
                }}
            >
                {Array.from({ length: cells }).map((_, i) => {
                    const url = images[i];
                    return (
                        <div
                            key={i}
                            style={{
                                background: url ? "transparent" : "rgba(255,255,255,0.04)",
                                border: url ? "none" : `1px dashed ${ctx.theme.node.stroke}`,
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                color: ctx.theme.node.placeholder,
                                backgroundImage: url ? `url(${url})` : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                overflow: "hidden",
                            }}
                        >
                            {!url && (i + 1)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default definePlugin({
    id: "lumen-grid",
    name: "宮格節點",
    version: "1.0.0",
    description: "批量拆解分鏡 — 借鑑 SHUO-Canvas v0.7.5",
    nodes: [
        {
            type: "lumen:grid",
            title: "宮格",
            icon: "▦",
            description: "N×M 批次生成",
            defaultSize: { width: 360, height: 360 },
            defaultMetadata: { rows: 2, cols: 3, images: [] as string[], prompt: "" },
            minimapColor: "#06b6d4",
            resource: (node) => ({ kind: "text", text: node.metadata?.prompt as string }),
            Content: GridContent,
        },
    ],
});
