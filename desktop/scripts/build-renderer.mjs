import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(here, "../../web");
const viteBin = resolve(webDir, "node_modules/vite/bin/vite.js");
const builtDir = resolve(webDir, "dist-desktop");
const rendererDir = resolve(here, "../renderer");

if (!existsSync(viteBin)) {
    throw new Error(`未找到 ${viteBin}，请先在 web/ 目录执行安装依赖`);
}

execFileSync(process.execPath, [viteBin, "build", "--base", "./", "--outDir", "dist-desktop"], {
    cwd: webDir,
    stdio: "inherit",
});

rmSync(rendererDir, { recursive: true, force: true });
cpSync(builtDir, rendererDir, { recursive: true });
