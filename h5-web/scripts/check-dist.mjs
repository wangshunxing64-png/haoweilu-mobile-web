import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../dist/", import.meta.url)); const forbidden = /fonts\.googleapis\.com|fonts\.gstatic\.com|images\.unsplash\.com|raw\.githubusercontent\.com/;
async function files(dir) { const entries = await readdir(dir, { withFileTypes: true }); const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])); return nested.flat(); }
const paths = await files(root); if (!paths.some((p) => p.endsWith("index.html"))) throw new Error("dist/index.html 缺失"); if (paths.some((p) => p.endsWith(".map"))) throw new Error("生产包包含 source map");
for (const path of paths.filter((p) => [".html", ".js", ".css", ".svg"].includes(extname(p)))) if (forbidden.test(await readFile(path, "utf8"))) throw new Error(`发现境外运行时资源：${path}`);
if (paths.filter((p) => p.endsWith(".js")).some((p) => !/-[A-Za-z0-9_-]{6,}\.js$/.test(p))) throw new Error("JavaScript 文件未使用内容哈希"); console.log(`dist policy passed (${paths.length} files)`);
