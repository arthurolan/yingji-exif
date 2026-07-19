const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

test("静态网页引用的本地核心资源都存在", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !reference.startsWith("#") && !reference.startsWith("mailto:") && reference !== "./")
    .filter((reference) => reference !== "https://arthurolan.github.io/yingji-exif/")
    .filter((reference) => reference !== "https://gc.zgo.at/count.v5.js");

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
  assert.match(html, /id="visit-counter-trigger"/);
  assert.match(html, /id="visit-counter-bubble"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
  assert.match(html, /data-goatcounter="https:\/\/yingji-exif-arthurolan\.goatcounter\.com\/count"/);
  assert.match(html, /src="https:\/\/gc\.zgo\.at\/count\.v5\.js"/);
  assert.match(html, /integrity="sha384-atnOLvQb9t\+jTSipvd75X2yginT4PjVbqDdlJAmxMm\+wYElFmeR6EmLP5bYeoRVQ"/);
  assert.match(app, /GPS 日期 \/ 时间（UTC）/);
  assert.match(app, /counter\/TOTAL\.json/);
  assert.match(app, /累计访问 \$\{await loadVisitCount\(\)\} 次/);
  assert.match(app, /访问统计暂时无法加载/);
  assert.match(app, /window\.setTimeout\(hideVisitCounter, 3000\)/);
  assert.match(app, /const MAX_FILE_SIZE = 300 \* 1024 \* 1024/);
  assert.match(app, /const MAX_PREVIEW_FILE_SIZE = 100 \* 1024 \* 1024/);
});
