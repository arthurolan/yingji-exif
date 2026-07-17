const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

test("静态网页引用的本地核心资源都存在", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !reference.startsWith("#") && !reference.startsWith("mailto:") && reference !== "./");

  assert.ok(references.length >= 4);
  for (const reference of references) {
    assert.equal(/^https?:/i.test(reference), false, `核心页面不应依赖远程资源：${reference}`);
    const localPath = reference.split(/[?#]/, 1)[0];
    assert.equal(fs.existsSync(path.join(projectRoot, localPath)), true, `缺少资源：${reference}`);
  }
});

test("页面名称和隐私提示使用已确认文案", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(projectRoot, "assets/js/app.js"), "utf8");
  assert.match(html, /<title>影迹·EXIF<\/title>/);
  assert.match(html, /<h1 id="page-title">一张照片背后的拍摄数据<\/h1>/);
  assert.match(html, /图片不上传，仅在本机解析/);
  assert.match(html, /单张最大 300 MB · 超过 100 MB 不生成预览/);
  assert.match(html, /<button id="clear-button"[^>]*>退出照片<\/button>/);
  assert.match(html, /© 2026 E\.O创作/);
  assert.match(html, /mailto:arthurolan99@gmail\.com/);
  assert.match(app, /GPS 日期 \/ 时间（UTC）/);
  assert.match(app, /const MAX_FILE_SIZE = 300 \* 1024 \* 1024/);
  assert.match(app, /const MAX_PREVIEW_FILE_SIZE = 100 \* 1024 \* 1024/);
});
