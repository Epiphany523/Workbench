// Lumen Canvas 剪輯節點（借鑑 SHUO-Canvas v0.7.5 剪輯節點）
import { definePlugin } from "@infinite-canvas/plugin-sdk";
import type { CanvasNodeContentProps } from "@infinite-canvas/plugin-sdk";

function ClipContent({ ctx }: CanvasNodeContentProps) {
    const start = Number(ctx.node.metadata?.start) || 0;
    const end = Number(ctx.node.metadata?.end) || 5;
    const total = Number(ctx.node.metadata?.total) || 10;
    const dur = Math.max(0, end - start);
    const updateMeta = (patch: Record<string, unknown>) => ctx.updateMetadata(patch);
    const sliderPercent = (start / Math.max(total, 1)) * 100;
    const widthPercent = ((end - start) / Math.max(total, 1)) * 100;

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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                    開始 <input type="number" min={0} max={total} step={0.1} value={start} onChange={(e) => updateMeta({ start: Number(e.target.value) })} style={{ width: 50, marginLeft: 4, marginRight: 6, background: "transparent", color: ctx.theme.node.text, border: `1px solid ${ctx.theme.node.stroke}`, borderRadius: 3, padding: "0 4px", fontSize: 11 }} />s
                </span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                    結束 <input type="number" min={0} max={total} step={0.1} value={end} onChange={(e) => updateMeta({ end: Number(e.target.value) })} style={{ width: 50, marginLeft: 4, marginRight: 6, background: "transparent", color: ctx.theme.node.text, border: `1px solid ${ctx.theme.node.stroke}`, borderRadius: 3, padding: "0 4px", fontSize: 11 }} />s
                </span>
                <button
                    type="button"
                    onClick={() => alert("v0.7.5 將串接真實剪輯 API")}
                    style={{
                        marginLeft: "auto",
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "#84cc16",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 11,
                    }}
                >
                    ✂ 剪輯 ({dur.toFixed(1)}s)
                </button>
            </div>
            <div
                style={{
                    position: "relative",
                    height: 36,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    marginTop: 4,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: `${sliderPercent}%`,
                        width: `${widthPercent}%`,
                        top: 4,
                        bottom: 4,
                        background: "rgba(132, 204, 22, 0.3)",
                        border: "1px solid #84cc16",
                        borderRadius: 4,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        textAlign: "center",
                        fontSize: 10,
                        opacity: 0.6,
                    }}
                >
                    {start.toFixed(1)}s → {end.toFixed(1)}s · 時長 {dur.toFixed(1)}s
                </div>
            </div>
        </div>
    );
}

export default definePlugin({
    id: "lumen-clip",
    name: "剪輯節點",
    version: "1.0.0",
    description: "時間軸裁剪 — 借鑑 SHUO-Canvas v0.7.5",
    nodes: [
        {
            type: "lumen:clip",
            title: "剪輯",
            icon: "✂",
            description: "時間線區段裁剪",
            defaultSize: { width: 320, height: 140 },
            defaultMetadata: { start: 0, end: 5, total: 10 },
            minimapColor: "#84cc16",
            Content: ClipContent,
        },
    ],
});
