// v0.7.1 語音工作臺（借鑑 SHUO-Canvas 語音工作室）
// 三段式：字幕辨識 / 翻譯 / 配音
// v0.7.1 為視覺骨架 + 路由入口；v0.7.2 串接真實 ASR/Translation/TTS API
import { Mic, FileText, Languages, Volume2, Upload, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { Button, Card, Tabs, Tag, Typography, Empty, App, Input, Select } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";

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

export default function VoicePage() {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const [activeTab, setActiveTab] = useState("asr");
    const [subtitles] = useState<SubtitleLine[]>(DEMO_SUBTITLES);
    const [targetLang, setTargetLang] = useState("zh-TW");
    const [voiceId, setVoiceId] = useState("female-calm");

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
            {/* Hero */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <Title level={2} style={{ marginBottom: 8 }}>
                        🎙 {t("navigation.voice") ?? "語音工作臺"}
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        字幕辨識 · 多語翻譯 · 批次配音 · 借鑑 SHUO-Canvas 語音工作室
                    </Paragraph>
                </div>
                <div className="flex items-center gap-2">
                    <Tag color="processing" style={{ borderRadius: 999, padding: "2px 12px" }}>
                        v0.7.1 preview
                    </Tag>
                </div>
            </div>

            {/* 工作流 tabs */}
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
                        children: <AsrPanel subtitles={subtitles} onUpload={() => message.info("v0.7.2 將串接 Whisper / 阿里云 ASR")} />,
                    },
                    {
                        key: "translate",
                        label: (
                            <span className="inline-flex items-center gap-2">
                                <Languages className="size-4" />
                                翻譯
                            </span>
                        ),
                        children: <TranslatePanel subtitles={subtitles} targetLang={targetLang} setTargetLang={setTargetLang} />,
                    },
                    {
                        key: "tts",
                        label: (
                            <span className="inline-flex items-center gap-2">
                                <Volume2 className="size-4" />
                                配音
                            </span>
                        ),
                        children: <TtsPanel subtitles={subtitles} voiceId={voiceId} setVoiceId={setVoiceId} />,
                    },
                ]}
            />
        </div>
    );
}

function AsrPanel({ subtitles, onUpload }: { subtitles: SubtitleLine[]; onUpload: () => void }) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card
                className="lg:col-span-1"
                style={{ borderRadius: 12, border: "1px solid var(--border, #e7e5e4)" }}
            >
                <div className="mb-3 flex items-center gap-2">
                    <Upload className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                    <Text strong>上傳媒體</Text>
                </div>
                <div
                    className="mb-3 flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
                    style={{ borderColor: "var(--border, #e7e5e4)" }}
                    onClick={onUpload}
                >
                    <Upload className="mb-2 size-6" style={{ color: "#a8a29e" }} />
                    <Text type="secondary">拖入或點擊上傳</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>mp4 / mov / wav / mp3</Text>
                </div>
                <Button block icon={<Sparkles className="size-4" />} onClick={onUpload}>
                    開始辨識
                </Button>
            </Card>

            <Card
                className="lg:col-span-2"
                title={
                    <span className="inline-flex items-center gap-2">
                        <FileText className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                        字幕結果
                    </span>
                }
                extra={<Tag color="success">{subtitles.length} 條</Tag>}
                style={{ borderRadius: 12 }}
            >
                {subtitles.length === 0 ? (
                    <Empty description="尚無字幕" />
                ) : (
                    <div className="space-y-2">
                        {subtitles.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-start gap-3 rounded-lg border p-3"
                                style={{ borderColor: "var(--border, #e7e5e4)" }}
                            >
                                <div
                                    className="flex shrink-0 items-center gap-1 rounded px-2 py-1 font-mono text-xs"
                                    style={{ background: "var(--muted, #f5f5f4)" }}
                                >
                                    <Clock className="size-3" />
                                    {s.start.toFixed(1)}s → {s.end.toFixed(1)}s
                                </div>
                                <div className="flex-1 text-sm">{s.text}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

function TranslatePanel({ subtitles, targetLang, setTargetLang }: any) {
    return (
        <Card
            title={
                <span className="inline-flex items-center gap-2">
                    <Languages className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                    批次翻譯
                </span>
            }
            extra={
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
            }
            style={{ borderRadius: 12 }}
        >
            <div className="space-y-2">
                {subtitles.map((s: SubtitleLine) => (
                    <div
                        key={s.id}
                        className="rounded-lg border p-3"
                        style={{ borderColor: "var(--border, #e7e5e4)" }}
                    >
                        <div className="mb-1 text-xs text-stone-500">
                            <span className="font-mono">{s.start.toFixed(1)}s → {s.end.toFixed(1)}s</span> · 原文
                        </div>
                        <div className="mb-2 text-sm text-stone-700 dark:text-stone-300">{s.text}</div>
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
        </Card>
    );
}

function TtsPanel({ subtitles, voiceId, setVoiceId }: any) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card
                title={
                    <span className="inline-flex items-center gap-2">
                        <Mic className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                        語音選擇
                    </span>
                }
                style={{ borderRadius: 12 }}
            >
                <div className="space-y-3">
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
                                borderColor: voiceId === v.id ? "var(--lumen-wine, #8B2845)" : "var(--border, #e7e5e4)",
                                background: voiceId === v.id ? "var(--lumen-wine-soft-bg, #fdf2f4)" : undefined,
                            }}
                            onClick={() => setVoiceId(v.id)}
                        >
                            <div className="text-sm font-medium">{v.label}</div>
                            <div className="text-xs text-stone-500">{v.desc}</div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card
                className="lg:col-span-2"
                title={
                    <span className="inline-flex items-center gap-2">
                        <Volume2 className="size-4" style={{ color: "var(--lumen-wine, #8B2845)" }} />
                        配音預覽
                    </span>
                }
                style={{ borderRadius: 12 }}
            >
                <div className="space-y-2">
                    {subtitles.map((s: SubtitleLine) => (
                        <div
                            key={s.id}
                            className="flex items-center gap-3 rounded-lg border p-3"
                            style={{ borderColor: "var(--border, #e7e5e4)" }}
                        >
                            <Button
                                shape="circle"
                                size="small"
                                icon={<Volume2 className="size-3" />}
                                onClick={() => {}}
                            />
                            <div
                                className="shrink-0 rounded px-2 py-1 font-mono text-xs"
                                style={{ background: "var(--muted, #f5f5f4)" }}
                            >
                                {s.start.toFixed(1)}s → {s.end.toFixed(1)}s
                            </div>
                            <div className="flex-1 text-sm">{s.translation || s.text}</div>
                            <Tag>v0.7.2 串接</Tag>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
