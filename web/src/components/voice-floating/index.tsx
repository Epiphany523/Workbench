// v0.7.2 語音工作臺浮動面板（畫布內）
// 從 /voice 路由改成浮動面板 — 老蔡要求「所有功能在畫布內」
import { Mic, X, Upload, FileText, Languages, Volume2, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { Button, Tabs, Tag, Typography, Empty, App, Select } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useVoicePanelStore } from "./store";

const { Title, Paragraph, Text } = Typography;

interface SubtitleLine {
    id: string;
    start: number;
    end: number;
    text: string;
    translation?: string;
}

const DEMO_SUBTITLES: SubtitleLine[] = [
    { id: "1", start: 0, end: 2.5, text: "你在这里做什么？", translation: "你在這裡做什麼？" },
    { id: "2", start: 2.5, end: 5.0, text: "我在等你。", translation: "我在等你。" },
    { id: "3", start: 5.0, end: 8.2, text: "我从来没有告诉过你关于那件事。", translation: "我從來沒有告訴過你關於那件事。" },
];

export function VoiceFloatingPanel() {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const open = useVoicePanelStore((s) => s.open);
    const close = useVoicePanelStore((s) => s.close);
    const [activeTab, setActiveTab] = useState("asr");
    const [targetLang, setTargetLang] = useState("zh-TW");
    const [voiceId, setVoiceId] = useState("female-calm");

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={close}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                className="fixed inset-y-0 right-0 z-50 flex w-[min(960px,100vw)] flex-col overflow-hidden shadow-2xl"
                style={{
                    background: "var(--color-background, #fff)",
                    borderLeft: "1px solid var(--color-border, #e7e5e4)",
                    animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                {/* Header */}
                <div
                    className="flex shrink-0 items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid var(--color-border, #e7e5e4)" }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex size-9 items-center justify-center rounded-lg"
                            style={{ background: "var(--lumen-wine-soft-bg, #fdf2f4)" }}
                        >
                            <Mic className="size-5" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                🎙 語音工作臺
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                字幕辨識 · 多語翻譯 · 批次配音 · 借鑑 SHUO-Canvas
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag color="processing" style={{ borderRadius: 999 }}>
                            v0.7.2 preview
                        </Tag>
                        <Button
                            type="text"
                            shape="circle"
                            icon={<X className="size-4" />}
                            onClick={close}
                            aria-label="關閉"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: "asr",
                                label: (
                                    <span className="inline-flex items-center gap-2">
                                        <FileText className="size-4" />
                                        字幕辨識
                                    </span>
                                ),
                                children: (
                                    <AsrBody
                                        subtitles={DEMO_SUBTITLES}
                                        onStart={() => message.info("v0.7.3 將串接 Whisper / 阿里云 ASR")}
                                    />
                                ),
                            },
                            {
                                key: "translate",
                                label: (
                                    <span className="inline-flex items-center gap-2">
                                        <Languages className="size-4" />
                                        翻譯
                                    </span>
                                ),
                                children: <TranslateBody targetLang={targetLang} setTargetLang={setTargetLang} />,
                            },
                            {
                                key: "tts",
                                label: (
                                    <span className="inline-flex items-center gap-2">
                                        <Volume2 className="size-4" />
                                        配音
                                    </span>
                                ),
                                children: <TtsBody voiceId={voiceId} setVoiceId={setVoiceId} />,
                            },
                        ]}
                    />
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </>
    );
}

function AsrBody({ subtitles, onStart }: { subtitles: SubtitleLine[]; onStart: () => void }) {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <div className="mb-3 flex items-center gap-2">
                    <Upload className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                    <Text strong>上傳媒體</Text>
                </div>
                <div
                    className="mb-3 flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition hover:border-stone-400"
                    style={{ borderColor: "var(--color-border, #e7e5e4)" }}
                    onClick={onStart}
                >
                    <Upload className="mb-2 size-7" style={{ color: "#a8a29e" }} />
                    <Text type="secondary">拖入或點擊上傳</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>mp4 / mov / wav / mp3</Text>
                </div>
                <Button block icon={<Sparkles className="size-4" />} onClick={onStart}>
                    開始辨識
                </Button>
            </div>
            <div className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                        <Text strong>字幕結果</Text>
                    </div>
                    <Tag color="success">{subtitles.length} 條</Tag>
                </div>
                <div className="space-y-2">
                    {subtitles.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-start gap-3 rounded-lg border p-3"
                            style={{ borderColor: "var(--color-border, #e7e5e4)" }}
                        >
                            <div
                                className="flex shrink-0 items-center gap-1 rounded px-2 py-1 font-mono text-xs"
                                style={{ background: "var(--color-muted, #f5f5f4)" }}
                            >
                                <Clock className="size-3" />
                                {s.start.toFixed(1)}s → {s.end.toFixed(1)}s
                            </div>
                            <div className="flex-1 text-sm">{s.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TranslateBody({ targetLang, setTargetLang }: { targetLang: string; setTargetLang: (v: string) => void }) {
    return (
        <div>
            <div className="mb-4 flex items-center justify-end gap-2">
                <Text type="secondary">目標語言：</Text>
                <Select
                    value={targetLang}
                    onChange={setTargetLang}
                    style={{ width: 160 }}
                    options={[
                        { value: "zh-TW", label: "繁體中文" },
                        { value: "en", label: "English" },
                        { value: "ja", label: "日本語" },
                        { value: "ko", label: "한국어" },
                    ]}
                />
            </div>
            <div className="space-y-2">
                {DEMO_SUBTITLES.map((s) => (
                    <div
                        key={s.id}
                        className="rounded-lg border p-3"
                        style={{ borderColor: "var(--color-border, #e7e5e4)" }}
                    >
                        <div className="mb-1 text-xs text-stone-500">
                            <span className="font-mono">{s.start.toFixed(1)}s → {s.end.toFixed(1)}s</span> · 原文
                        </div>
                        <div className="mb-2 text-sm">{s.text}</div>
                        {s.translation && (
                            <>
                                <div className="mb-1 text-xs" style={{ color: "var(--lumen-wine, #8B2845)" }}>
                                    <CheckCircle2 className="mr-1 inline size-3" />
                                    譯文
                                </div>
                                <div className="text-sm font-medium">{s.translation}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function TtsBody({ voiceId, setVoiceId }: { voiceId: string; setVoiceId: (v: string) => void }) {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <div className="mb-3 flex items-center gap-2">
                    <Volume2 className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                    <Text strong>語音選擇</Text>
                </div>
                <div className="space-y-2">
                    {[
                        { id: "female-calm", label: "女聲 · 平靜", desc: "成熟女聲，敘事首選" },
                        { id: "male-warm", label: "男聲 · 溫暖", desc: "中年男聲，旁白首選" },
                        { id: "female-vivid", label: "女聲 · 鮮明", desc: "年輕女聲，對話首選" },
                        { id: "male-bright", label: "男聲 · 明亮", desc: "少年男聲，動作場景" },
                    ].map((v) => (
                        <div
                            key={v.id}
                            className="cursor-pointer rounded-lg border p-3 transition hover:border-stone-400"
                            style={{
                                borderColor: voiceId === v.id ? "var(--lumen-wine, #8B2845)" : "var(--color-border, #e7e5e4)",
                                background: voiceId === v.id ? "var(--lumen-wine-soft-bg, #fdf2f4)" : undefined,
                            }}
                            onClick={() => setVoiceId(v.id)}
                        >
                            <div className="text-sm font-medium">{v.label}</div>
                            <div className="text-xs text-stone-500">{v.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className="mb-3 flex items-center gap-2">
                    <Mic className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                    <Text strong>配音預覽</Text>
                </div>
                <div className="space-y-2">
                    {DEMO_SUBTITLES.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center gap-3 rounded-lg border p-3"
                            style={{ borderColor: "var(--color-border, #e7e5e4)" }}
                        >
                            <Button shape="circle" size="small" icon={<Volume2 className="size-3" />} onClick={() => {}} />
                            <div
                                className="shrink-0 rounded px-2 py-1 font-mono text-xs"
                                style={{ background: "var(--color-muted, #f5f5f4)" }}
                            >
                                {s.start.toFixed(1)}s → {s.end.toFixed(1)}s
                            </div>
                            <div className="flex-1 text-sm">{s.translation || s.text}</div>
                            <Tag>v0.7.3 串接</Tag>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
