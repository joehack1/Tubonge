import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const mobileWwwRoot = path.resolve(__dirname, "..", "www");

const filesToSync = [
  "2580.jpg",
  "admin.html",
  "admin.js",
  "chat.html",
  "chat.js",
  "favicon.ico",
  "index.html",
  "login.html",
  "login.js",
  "logo.png",
  "logo2.png",
  "screenshot.gif",
  "script.js",
  "site.webmanifest",
  "styles.css",
  "theme.js"
];

for (const relativePath of filesToSync) {
  const sourcePath = path.join(repoRoot, relativePath);
  const targetPath = path.join(mobileWwwRoot, relativePath);

  await access(sourcePath, constants.R_OK);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);

  console.log(`Synced ${relativePath}`);
}
