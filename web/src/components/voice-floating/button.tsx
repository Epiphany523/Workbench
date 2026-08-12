// v0.7.2 畫布內浮動按鈕 — 在畫布右下角
// 老蔡要求「所有功能在畫布內」：用浮動按鈕代替獨立路由
import { Mic } from "lucide-react";
import { useVoicePanelStore } from "./store";
import { VoiceFloatingPanel } from "./index";
import { useTranslation } from "react-i18next";

export function VoiceFloatingButton() {
    const open = useVoicePanelStore((s) => s.open);
    const toggle = useVoicePanelStore((s) => s.toggle);
    const { t } = useTranslation();

    return (
        <>
            <button
                type="button"
                onClick={toggle}
                title={open ? "關閉語音工作臺" : "開啟語音工作臺（畫布內）"}
                aria-label={open ? "關閉語音工作臺" : "開啟語音工作臺"}
                className="fixed bottom-32 right-5 z-30 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition hover:scale-105"
                style={{
                    background: open ? "var(--lumen-wine-soft-bg, #fdf2f4)" : "var(--lumen-wine, #8B2845)",
                    color: open ? "var(--lumen-wine, #8B2845)" : "#fff",
                    border: "1px solid var(--lumen-wine, #8B2845)",
                }}
            >
                <Mic className="size-4" />
                <span>🎙 語音</span>
            </button>
            <VoiceFloatingPanel />
        </>
    );
}
