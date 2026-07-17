const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ExifReader = require("../assets/vendor/exifreader/exif-reader.js");
const coordinates = require("../assets/js/coordinates.js");

const projectRoot = path.resolve(__dirname, "..");
const options = {
  expanded: true,
  computed: true,
  excludeTags: { xmp: true, iptc: true, icc: true, photoshop: true },
};

function samplePath(name) {
  return path.join(projectRoot, name);
}

function loadSample(name) {
  return ExifReader.load(fs.readFileSync(samplePath(name)), options);
}

function skipWithout(name) {
  return fs.existsSync(samplePath(name)) ? false : `本机没有测试样片 ${name}`;
}

test("无 EXIF 样片应只有文件/JFIF信息", { skip: skipWithout("无EXIF.jpeg") }, () => {
  const tags = loadSample("无EXIF.jpeg");
  assert.equal(tags.exif, undefined);
  assert.equal(tags.gps, undefined);
  assert.equal(tags.file.FileType.description, "JPEG");
});

test("境外 GPS 样片应保留 WGS-84", { skip: skipWithout("国外GPS.jpg") }, () => {
  const tags = loadSample("国外GPS.jpg");
  const converted = coordinates.convertForMaps(tags.gps.Longitude, tags.gps.Latitude);
  assert.equal(converted.shifted, false);
});

test("国内 GPS 样片应进入大陆转换范围", { skip: skipWithout("国内GPS.jpeg") }, () => {
  const tags = loadSample("国内GPS.jpeg");
  const converted = coordinates.convertForMaps(tags.gps.Longitude, tags.gps.Latitude);
  assert.equal(converted.shifted, true);
  assert.ok(Number.isFinite(tags.gps.Altitude));
});

test("EXIF 不完整样片仍应读取已有日期", { skip: skipWithout("EXIF似乎不正常.jpeg") }, () => {
  const tags = loadSample("EXIF似乎不正常.jpeg");
  assert.equal(tags.exif.DateTime.value[0], "2022:08:06 16:40:13");
  assert.equal(tags.exif.Make, undefined);
  assert.equal(tags.exif.Model, undefined);
});

test("旋转样片应暴露实际尺寸与 EXIF 尺寸冲突", { skip: skipWithout("旋转方向，无GPS.jpeg") }, () => {
  const tags = loadSample("旋转方向，无GPS.jpeg");
  assert.equal(tags.file["Image Width"].value, 3840);
  assert.equal(tags.file["Image Height"].value, 2160);
  assert.equal(tags.exif.PixelXDimension.value, 2160);
  assert.equal(tags.exif.PixelYDimension.value, 3840);
  assert.equal(tags.exif.Orientation.value, 1);
});

test("正常无 GPS 样片应有相机和镜头但不显示位置", { skip: skipWithout("有EXIF但无GPS.jpg") }, () => {
  const tags = loadSample("有EXIF但无GPS.jpg");
  assert.equal(tags.exif.Model.description, "ILCE-7RM3");
  assert.match(tags.exif.LensModel.description, /105mm F2\.8/);
  assert.equal(tags.gps, undefined);
});
