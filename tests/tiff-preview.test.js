const test = require("node:test");
const assert = require("node:assert/strict");
const { decode } = require("../assets/js/tiff-preview.js");

function makeOnePixelRgbTiff() {
  const buffer = Buffer.alloc(143);
  buffer.write("II", 0, "ascii");
  buffer.writeUInt16LE(42, 2);
  buffer.writeUInt32LE(8, 4);
  buffer.writeUInt16LE(10, 8);
  const entries = [
    [256, 3, 1, 1],
    [257, 3, 1, 1],
    [258, 3, 3, 134],
    [259, 3, 1, 1],
    [262, 3, 1, 2],
    [273, 4, 1, 140],
    [277, 3, 1, 3],
    [278, 4, 1, 1],
    [279, 4, 1, 3],
    [284, 3, 1, 1],
  ];
  entries.forEach(([tag, type, count, value], index) => {
    const offset = 10 + index * 12;
    buffer.writeUInt16LE(tag, offset);
    buffer.writeUInt16LE(type, offset + 2);
    buffer.writeUInt32LE(count, offset + 4);
    if (type === 3 && count === 1) buffer.writeUInt16LE(value, offset + 8);
    else buffer.writeUInt32LE(value, offset + 8);
  });
  buffer.writeUInt16LE(8, 134);
  buffer.writeUInt16LE(8, 136);
  buffer.writeUInt16LE(8, 138);
  buffer.set([17, 34, 51], 140);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

test("TIFF 后备预览可解码无压缩 8-bit RGB", () => {
  const result = decode(makeOnePixelRgbTiff(), 1800);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.deepEqual([...result.rgba], [17, 34, 51, 255]);
});

test("TIFF 后备预览明确拒绝不支持的压缩方式", () => {
  const buffer = makeOnePixelRgbTiff();
  new DataView(buffer).setUint16(54, 5, true);
  assert.throws(() => decode(buffer), /TIFF_COMPRESSION/);
});
