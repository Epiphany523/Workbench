import type { ReactNode } from "react";

import { AgentPanel } from "@/components/agent/agent-panel";
import { AppTopNav } from "@/components/layout/app-top-nav";
import { VoiceFloatingButton } from "@/components/voice-floating/button";

// 依條件注入：只在畫布頁顯示語音浮動按鈕
import { useLocation } from "react-router-dom";

export default function UserLayout({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const showVoice = /^\/canvas(\/|$)/.test(pathname);
    return (
        <div className="flex h-dvh overflow-hidden bg-background text-foreground">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <AppTopNav />
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            </div>
            <AgentPanel />
            {showVoice && <VoiceFloatingButton />}
        </div>
    );
}
