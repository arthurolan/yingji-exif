const test = require("node:test");
const assert = require("node:assert/strict");
const ExifReader = require("../assets/vendor/exifreader/exif-reader.js");

const ONE_PIXEL_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/24iF3QAAAABJRU5ErkJggg==";

test("本地化解析器可以离线识别有效图片", () => {
  const tags = ExifReader.load(Buffer.from(ONE_PIXEL_PNG, "base64"), { expanded: true, computed: true });
  assert.equal(tags.file.FileType.description, "PNG");
  assert.equal(tags.pngFile["Image Width"].value, 1);
  assert.equal(tags.pngFile["Image Height"].value, 1);
});

test("本地化解析器会拒绝损坏文件", () => {
  assert.throws(() => ExifReader.load(Buffer.from("not an image")), /Invalid image format/);
});
