// Lumen Canvas 拼圖節點（借鑑 SHUO-Canvas v0.7.5 拼圖節點）
import { definePlugin } from "@infinite-canvas/plugin-sdk";
import type { CanvasNodeContentProps } from "@infinite-canvas/plugin-sdk";

function CollageContent({ ctx }: CanvasNodeContentProps) {
    const images: string[] = (ctx.node.metadata?.images as string[]) || [];
    const layout: "grid" | "strip" | "masonry" = (ctx.node.metadata?.layout as "grid" | "strip" | "masonry") || "grid";
    const updateMeta = (patch: Record<string, unknown>) => ctx.updateMetadata(patch);

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
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>佈局:</span>
                {(["grid", "strip", "masonry"] as const).map((l) => (
                    <button
                        key={l}
                        type="button"
                        onClick={() => updateMeta({ layout: l })}
                        style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: `1px solid ${ctx.theme.node.stroke}`,
                            background: layout === l ? "#8B2845" : "transparent",
                            color: layout === l ? "#fff" : ctx.theme.node.text,
                            fontSize: 10,
                            cursor: "pointer",
                        }}
                    >
                        {l === "grid" ? "格子" : l === "strip" ? "長條" : "瀑布"}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => alert("v0.7.5 將串接真實拼圖 API")}
                    style={{
                        marginLeft: "auto",
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "#ec4899",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 11,
                    }}
                >
                    ✨ 拼圖
                </button>
            </div>
            <div
                style={{
                    flex: 1,
                    display: layout === "strip" ? "flex" : "grid",
                    gridTemplateColumns: layout === "grid" ? "1fr 1fr" : undefined,
                    gridTemplateRows: layout === "masonry" ? "auto auto" : undefined,
                    gap: 4,
                    background: "rgba(0,0,0,0.04)",
                    borderRadius: 6,
                    padding: 4,
                    minHeight: 0,
                }}
            >
                {Array.from({ length: Math.max(images.length, 4) }).map((_, i) => {
                    const url = images[i];
                    return (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                minHeight: 60,
                                background: url ? "transparent" : "rgba(255,255,255,0.04)",
                                border: url ? "none" : `1px dashed ${ctx.theme.node.stroke}`,
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                color: ctx.theme.node.placeholder,
                                backgroundImage: url ? `url(${url})` : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            {!url && "+"}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default definePlugin({
    id: "lumen-collage",
    name: "拼圖節點",
    version: "1.0.0",
    description: "多圖組合 — 借鑑 SHUO-Canvas v0.7.5",
    nodes: [
        {
            type: "lumen:collage",
            title: "拼圖",
            icon: "◫",
            description: "自由組合多張圖",
            defaultSize: { width: 340, height: 280 },
            defaultMetadata: { images: [] as string[], layout: "grid" as const },
            minimapColor: "#ec4899",
            Content: CollageContent,
        },
    ],
});
