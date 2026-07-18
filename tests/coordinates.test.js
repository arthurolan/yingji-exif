const test = require("node:test");
const assert = require("node:assert/strict");
const coordinates = require("../assets/js/coordinates.js");

test("北京坐标应进入大陆转换范围并产生偏移", () => {
  const result = coordinates.wgs84ToGcj02(116.397389, 39.908722);
  assert.equal(result.shifted, true);
  assert.ok(Math.abs(result.lon - 116.40363) < 0.001);
  assert.ok(Math.abs(result.lat - 39.91013) < 0.001);
});

test("东京坐标应保持 WGS-84 不变", () => {
  const result = coordinates.wgs84ToGcj02(139.6917, 35.6895);
  assert.deepEqual(result, { lon: 139.6917, lat: 35.6895, shifted: false });
});

test("台北坐标不应被大陆多边形误判", () => {
  assert.equal(coordinates.isMainlandConversionArea(121.5654, 25.0330), false);
});

test("大陆坐标的地图链接应分别使用目标坐标系", () => {
  const wgs = { lon: 117.20039111166666, lat: 39.131320833333334 };
  const converted = coordinates.convertForMaps(wgs.lon, wgs.lat);
  const links = coordinates.buildMapLinks(converted, "china");
  assert.match(links.apple, /maps\.apple\.com/);
  assert.match(links.amap, /coordinate=gaode/);
  assert.match(links.baidu, /coord_type=bd09ll/);
  assert.match(links.baidu, /src=webapp\.yingji\.exif/);
  assert.equal(
    links.google,
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${converted.gcj.lat.toFixed(8)},${converted.gcj.lon.toFixed(8)}`)}`,
  );
  assert.doesNotMatch(links.google, new RegExp(wgs.lat.toFixed(8)));
});

test("境外坐标传给百度地图时应声明为 WGS-84", () => {
  const converted = coordinates.convertForMaps(100.53027056, 13.74597694);
  const links = coordinates.buildMapLinks(converted, "china");
  assert.equal(converted.shifted, false);
  assert.match(links.baidu, /coord_type=wgs84/);
  assert.equal(
    links.google,
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${converted.wgs.lat.toFixed(8)},${converted.wgs.lon.toFixed(8)}`)}`,
  );
});

test("非法坐标应被拒绝", () => {
  assert.throws(() => coordinates.wgs84ToGcj02(181, 0), /合法范围/);
});
