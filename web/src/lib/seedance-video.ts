import i18n from "@/i18n";
import { resolveModelRequestConfig, type AiConfig } from "@/stores/use-config-store";
import type { ReferenceImage } from "@/types/image";
import type { ReferenceAudio, ReferenceVideo } from "@/types/media";

export const SEEDANCE_REFERENCE_LIMITS = {
    images: 9,
    videos: 3,
    audios: 3,
    imageMaxBytes: 30 * 1024 * 1024,
    videoMaxBytes: 200 * 1024 * 1024,
    audioMaxBytes: 15 * 1024 * 1024,
};
export const SEEDANCE_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime"];

const SEEDANCE_RESOLUTION_LABELS = [
    { value: "480p", label: "480p" },
    { value: "720p", label: "720p" },
    { value: "1080p", label: "1080p" },
    { value: "4k", label: "4K" },
] as const;

export const seedanceRatioOptions = [
    { value: "16:9" },
    { value: "9:16" },
    { value: "1:1" },
    { value: "4:3" },
    { value: "3:4" },
    { value: "21:9" },
    { value: "adaptive" },
] as const;

const SEEDANCE_DURATION_STEPS = [4, 5, 6, 8, 10, 12, 15] as const;

/**
 * Per-model format limits, confirmed from BytePlus docs (duration/resolution differ per Seedance model family —
 * see BYTEPLUS_VIDEO_INTEGRATION.md §2.x). Ratio support is the same 7-value set across these models, so it isn't
 * modeled here. Unmatched/custom model names (e.g. a user-added endpoint) fall back to DEFAULT_SEEDANCE_MODEL_SPEC.
 */
export type SeedanceModelSpec = {
    resolutions: readonly (typeof SEEDANCE_RESOLUTION_LABELS)[number]["value"][];
    defaultResolution: (typeof SEEDANCE_RESOLUTION_LABELS)[number]["value"];
    durationMin: number;
    durationMax: number;
    durationDefault: number;
    allowSmartDuration: boolean;
};

const DEFAULT_SEEDANCE_MODEL_SPEC: SeedanceModelSpec = { resolutions: ["480p", "720p", "1080p"], defaultResolution: "720p", durationMin: 4, durationMax: 15, durationDefault: 5, allowSmartDuration: true };

const SEEDANCE_MODEL_SPECS: Array<{ match: (key: string) => boolean; spec: SeedanceModelSpec }> = [
    // Dreamina Seedance 2.0 fast / 2.0 mini: no 1080p/4k.
    { match: (key) => key.includes("2-0-fast") || key.includes("2-0-mini"), spec: { resolutions: ["480p", "720p"], defaultResolution: "720p", durationMin: 4, durationMax: 15, durationDefault: 5, allowSmartDuration: true } },
    // Dreamina Seedance 2.0 (base tier): adds 1080p and 4k.
    { match: (key) => key.includes("2-0"), spec: { resolutions: ["480p", "720p", "1080p", "4k"], defaultResolution: "720p", durationMin: 4, durationMax: 15, durationDefault: 5, allowSmartDuration: true } },
    // Dreamina Seedance 1.5 pro: no 4k, shorter max duration (12s, no 15s step).
    { match: (key) => key.includes("1-5-pro"), spec: { resolutions: ["480p", "720p", "1080p"], defaultResolution: "720p", durationMin: 4, durationMax: 12, durationDefault: 5, allowSmartDuration: true } },
];

function seedanceModelKey(model: string) {
    return (model || "").toLowerCase().replace(/\./g, "-");
}

export function resolveSeedanceModelSpec(model: string): SeedanceModelSpec {
    const key = seedanceModelKey(model);
    return SEEDANCE_MODEL_SPECS.find((entry) => entry.match(key))?.spec || DEFAULT_SEEDANCE_MODEL_SPEC;
}

export function seedanceResolutionOptionsFor(model: string) {
    const spec = resolveSeedanceModelSpec(model);
    return SEEDANCE_RESOLUTION_LABELS.filter((item) => spec.resolutions.includes(item.value));
}

export function seedanceDurationOptionsFor(model: string) {
    const spec = resolveSeedanceModelSpec(model);
    const steps = SEEDANCE_DURATION_STEPS.filter((value) => value >= spec.durationMin && value <= spec.durationMax);
    return spec.allowSmartDuration ? [-1, ...steps] : steps;
}

export function currentSeedanceModelName(config: AiConfig) {
    return resolveModelRequestConfig(config, config.model || config.videoModel).model;
}

const seedancePixels = {
    "480p": {
        "16:9": "864x496",
        "4:3": "752x560",
        "1:1": "640x640",
        "3:4": "560x752",
        "9:16": "496x864",
        "21:9": "992x432",
    },
    "720p": {
        "16:9": "1280x720",
        "4:3": "1112x834",
        "1:1": "960x960",
        "3:4": "834x1112",
        "9:16": "720x1280",
        "21:9": "1470x630",
    },
    "1080p": {
        "16:9": "1920x1080",
        "4:3": "1664x1248",
        "1:1": "1440x1440",
        "3:4": "1248x1664",
        "9:16": "1080x1920",
        "21:9": "2206x946",
    },
} as const;

/** 4K pixel dims aren't in the confirmed doc excerpt we have — derived as 2x the 1080p entry (standard 4K UHD = 2x 1080p), not a verbatim doc table. Cosmetic label only; the API only ever receives the "4k" resolution token, not these pixels. */
const seedance4kPixels = Object.fromEntries(Object.entries(seedancePixels["1080p"]).map(([ratio, dims]) => [ratio, scalePixelDims(dims, 2)])) as Record<keyof typeof seedancePixels["1080p"], string>;

function scalePixelDims(dims: string, factor: number) {
    const [width, height] = dims.split("x").map(Number);
    return `${width * factor}x${height * factor}`;
}

export function isSeedanceVideoConfig(config: AiConfig | Pick<AiConfig, "model" | "videoModel" | "apiFormat">) {
    const requestConfig = "channels" in config ? resolveModelRequestConfig(config, config.model || config.videoModel) : config;
    return requestConfig.apiFormat === "ark";
}

export function normalizeSeedanceResolution(value: string, model: string) {
    const spec = resolveSeedanceModelSpec(model);
    const normalized = normalizeResolutionToken(value);
    return (spec.resolutions as readonly string[]).includes(normalized) ? (normalized as SeedanceModelSpec["defaultResolution"]) : spec.defaultResolution;
}

export function normalizeResolutionToken(value: string) {
    if (value === "low") return "480p";
    if (value === "auto" || value === "high" || value === "medium") return "720p";
    if (/^4k$/i.test(value || "")) return "4k";
    const resolution = String(value || "").replace(/p$/i, "") || "720";
    return `${resolution}p`;
}

export function normalizeSeedanceDuration(value: string, model: string) {
    const spec = resolveSeedanceModelSpec(model);
    if (spec.allowSmartDuration && String(value).trim() === "-1") return -1;
    const seconds = Math.floor(Number(value) || spec.durationDefault);
    return Math.max(spec.durationMin, Math.min(spec.durationMax, seconds));
}

export function normalizeSeedanceRatio(value: string) {
    if (!value || value === "auto" || value === "adaptive") return "adaptive";
    if (seedanceRatioOptions.some((item) => item.value === value)) return value;
    const match = value.match(/^(\d+)x(\d+)$/);
    if (!match) return "adaptive";
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!width || !height) return "adaptive";
    const ratio = width / height;
    const options = [
        ["16:9", 16 / 9],
        ["4:3", 4 / 3],
        ["1:1", 1],
        ["3:4", 3 / 4],
        ["9:16", 9 / 16],
        ["21:9", 21 / 9],
    ] as const;
    return options.reduce((best, item) => (Math.abs(item[1] - ratio) < Math.abs(best[1] - ratio) ? item : best), options[0])[0];
}

export function seedancePixelLabel(resolution: string, ratio: string, model: string) {
    const normalizedResolution = normalizeSeedanceResolution(resolution, model);
    const normalizedRatio = normalizeSeedanceRatio(ratio) as keyof typeof seedancePixels["1080p"] | "adaptive";
    if (normalizedRatio === "adaptive") return i18n.t("seedance.autoMatch");
    const table = normalizedResolution === "4k" ? seedance4kPixels : seedancePixels[normalizedResolution as keyof typeof seedancePixels];
    return table?.[normalizedRatio] || "";
}

/**
 * Per BytePlus docs, first_frame / first_and_last_frame / omni-reference (multi-image) are mutually exclusive
 * content-shapes for a single video generation request — the request must pick exactly one, not mix roles.
 * "reference" (the pre-existing, still-default behavior) sends every attached image as role: "reference_image".
 */
export const SEEDANCE_REFERENCE_MODES = ["reference", "first_frame", "first_last_frame"] as const;
export type SeedanceReferenceMode = (typeof SEEDANCE_REFERENCE_MODES)[number];

export function normalizeSeedanceReferenceMode(value: string | undefined): SeedanceReferenceMode {
    return (SEEDANCE_REFERENCE_MODES as readonly string[]).includes(value || "") ? (value as SeedanceReferenceMode) : "reference";
}

/** Maps attached reference images (in their existing order) to content[] roles for the given scenario; extra images beyond what a scenario uses are dropped, not silently mixed with reference_image. */
export function seedanceImageRoles(mode: SeedanceReferenceMode, count: number): string[] {
    if (mode === "first_frame") return count > 0 ? ["first_frame"] : [];
    if (mode === "first_last_frame") {
        if (count >= 2) return ["first_frame", "last_frame"];
        if (count === 1) return ["first_frame"];
        return [];
    }
    return new Array(Math.min(count, SEEDANCE_REFERENCE_LIMITS.images)).fill("reference_image");
}

export function boolConfig(value: string | undefined, fallback: boolean) {
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

export function seedanceReferenceLabel(kind: "image" | "video" | "audio", index: number) {
    return i18n.t(`seedance.references.${kind}`, { index: index + 1 });
}

export function buildSeedancePromptText(prompt: string, images: ReferenceImage[], videos: ReferenceVideo[], audios: ReferenceAudio[], mode: SeedanceReferenceMode = "reference") {
    const labels = [
        // first_frame/first_last_frame roles already carry frame semantics natively; the numbered "reference image N" labels are only meaningful for disambiguating an omni multi-image reference set.
        ...(mode === "reference" ? images.map((_, index) => seedanceReferenceLabel("image", index)) : []),
        ...videos.map((_, index) => seedanceReferenceLabel("video", index)),
        ...audios.map((_, index) => seedanceReferenceLabel("audio", index)),
    ];
    const text = prompt.trim();
    if (!labels.length) return text;
    return i18n.t("seedance.promptPrefix", { labels: labels.join(i18n.t("seedance.separator")), prompt: text });
}

export function seedanceVideoReferenceError(videos: ReferenceVideo[]) {
    let totalDurationMs = 0;
    for (let index = 0; index < videos.length; index += 1) {
        const video = videos[index];
        const label = seedanceReferenceLabel("video", index);
        if (!SEEDANCE_VIDEO_MIME_TYPES.includes(video.type)) return i18n.t("seedance.errors.format", { label });
        if (video.bytes && video.bytes > SEEDANCE_REFERENCE_LIMITS.videoMaxBytes) return i18n.t("seedance.errors.size", { label });
        if (video.durationMs) {
            if (video.durationMs < 2000 || video.durationMs > 15000) return i18n.t("seedance.errors.duration", { label });
            totalDurationMs += video.durationMs;
        }
        if (video.width && video.height) {
            if (video.width < 300 || video.width > 6000 || video.height < 300 || video.height > 6000) return i18n.t("seedance.errors.dimensions", { label });
            const ratio = video.width / video.height;
            if (ratio < 0.4 || ratio > 2.5) return i18n.t("seedance.errors.ratio", { label });
            const pixels = video.width * video.height;
            if (pixels < 640 * 640 || pixels > 3326 * 2494) return i18n.t("seedance.errors.pixels", { label });
        }
    }
    if (totalDurationMs > 15000) return i18n.t("seedance.errors.totalDuration");
    return "";
}

export function seedanceVideoReferenceHint() {
    return i18n.t("seedance.referenceHint");
}
