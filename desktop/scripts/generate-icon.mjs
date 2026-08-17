import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const here = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(here, "../../web/public/logo.svg");
const outDir = resolve(here, "../build");
const pngPath = resolve(outDir, "icon-256.png");
const icoPath = resolve(outDir, "icon.ico");

mkdirSync(outDir, { recursive: true });
await sharp(svgPath, { density: 384 }).resize(256, 256).png().toFile(pngPath);
const icoBuffer = await pngToIco([pngPath]);
writeFileSync(icoPath, icoBuffer);
unlinkSync(pngPath);

console.log(`已生成 ${icoPath}`);
