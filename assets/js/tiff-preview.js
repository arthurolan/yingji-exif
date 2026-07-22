(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.YingjiTiffPreview = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const TYPE_SIZES = { 1: 1, 2: 1, 3: 2, 4: 4 };

  function decode(buffer, maxDimension) {
    const view = buffer instanceof DataView ? buffer : new DataView(buffer);
    if (view.byteLength < 8) throw new Error("TIFF_HEADER");
    const marker = String.fromCharCode(view.getUint8(0), view.getUint8(1));
    if (marker !== "II" && marker !== "MM") throw new Error("TIFF_BYTE_ORDER");
    const littleEndian = marker === "II";
    if (view.getUint16(2, littleEndian) !== 42) throw new Error("TIFF_MAGIC");

    const ifdOffset = view.getUint32(4, littleEndian);
    if (ifdOffset + 2 > view.byteLength) throw new Error("TIFF_IFD");
    const entryCount = view.getUint16(ifdOffset, littleEndian);
    const tags = new Map();

    for (let index = 0; index < entryCount; index += 1) {
      const offset = ifdOffset + 2 + index * 12;
      if (offset + 12 > view.byteLength) throw new Error("TIFF_IFD_ENTRY");
      const tag = view.getUint16(offset, littleEndian);
      const type = view.getUint16(offset + 2, littleEndian);
      const count = view.getUint32(offset + 4, littleEndian);
      if (!TYPE_SIZES[type] || count > 1000000) continue;
      const byteLength = TYPE_SIZES[type] * count;
      const valueOffset = byteLength <= 4 ? offset + 8 : view.getUint32(offset + 8, littleEndian);
      if (valueOffset + byteLength > view.byteLength) throw new Error("TIFF_TAG_RANGE");
      const values = [];
      for (let item = 0; item < count; item += 1) {
        const itemOffset = valueOffset + item * TYPE_SIZES[type];
        if (type === 1 || type === 2) values.push(view.getUint8(itemOffset));
        if (type === 3) values.push(view.getUint16(itemOffset, littleEndian));
        if (type === 4) values.push(view.getUint32(itemOffset, littleEndian));
      }
      tags.set(tag, values);
    }

    const first = (tag, fallback) => tags.get(tag)?.[0] ?? fallback;
    const width = first(256, 0);
    const height = first(257, 0);
    const bits = tags.get(258) || [1];
    const compression = first(259, 1);
    const photometric = first(262, 2);
    const stripOffsets = tags.get(273) || [];
    const samplesPerPixel = first(277, photometric === 2 ? 3 : 1);
    const rowsPerStrip = first(278, height);
    const stripByteCounts = tags.get(279) || [];
    const planarConfiguration = first(284, 1);
    const orientation = first(274, 1);

    if (!width || !height || width * height > 120000000) throw new Error("TIFF_DIMENSIONS");
    if (compression !== 1) throw new Error("TIFF_COMPRESSION");
    if (!bits.every((value) => value === 8)) throw new Error("TIFF_BIT_DEPTH");
    if (![0, 1, 2].includes(photometric)) throw new Error("TIFF_COLOR");
    if (![1, 2, 3, 4].includes(samplesPerPixel) || planarConfiguration !== 1) throw new Error("TIFF_LAYOUT");
    if (!stripOffsets.length || rowsPerStrip < 1) throw new Error("TIFF_STRIPS");

    const rotated = orientation >= 5 && orientation <= 8;
    const orientedWidth = rotated ? height : width;
    const orientedHeight = rotated ? width : height;
    const limit = Math.max(320, Math.min(Number(maxDimension) || 1800, 2400));
    const scale = Math.min(1, limit / Math.max(orientedWidth, orientedHeight));
    const outputWidth = Math.max(1, Math.round(orientedWidth * scale));
    const outputHeight = Math.max(1, Math.round(orientedHeight * scale));
    const rgba = new Uint8ClampedArray(outputWidth * outputHeight * 4);

    function orientedToSource(orientedX, orientedY) {
      switch (orientation) {
        case 2: return [width - 1 - orientedX, orientedY];
        case 3: return [width - 1 - orientedX, height - 1 - orientedY];
        case 4: return [orientedX, height - 1 - orientedY];
        case 5: return [orientedY, orientedX];
        case 6: return [orientedY, height - 1 - orientedX];
        case 7: return [width - 1 - orientedY, height - 1 - orientedX];
        case 8: return [width - 1 - orientedY, orientedX];
        default: return [orientedX, orientedY];
      }
    }

    function sourceOffset(x, y) {
      const stripIndex = Math.floor(y / rowsPerStrip);
      const stripOffset = stripOffsets[stripIndex];
      if (stripOffset === undefined) throw new Error("TIFF_STRIP_INDEX");
      const rowInStrip = y - stripIndex * rowsPerStrip;
      const offset = stripOffset + (rowInStrip * width + x) * samplesPerPixel;
      const stripLength = stripByteCounts[stripIndex];
      if (stripLength !== undefined && offset + samplesPerPixel > stripOffset + stripLength) throw new Error("TIFF_STRIP_RANGE");
      if (offset + samplesPerPixel > view.byteLength) throw new Error("TIFF_PIXEL_RANGE");
      return offset;
    }

    for (let y = 0; y < outputHeight; y += 1) {
      const orientedY = Math.min(orientedHeight - 1, Math.floor(y / scale));
      for (let x = 0; x < outputWidth; x += 1) {
        const orientedX = Math.min(orientedWidth - 1, Math.floor(x / scale));
        const [sourceX, sourceY] = orientedToSource(orientedX, orientedY);
        const offset = sourceOffset(sourceX, sourceY);
        let red;
        let green;
        let blue;
        if (photometric === 2) {
          red = view.getUint8(offset);
          green = view.getUint8(offset + 1);
          blue = view.getUint8(offset + 2);
        } else {
          const value = view.getUint8(offset);
          const gray = photometric === 0 ? 255 - value : value;
          red = gray;
          green = gray;
          blue = gray;
        }
        const output = (y * outputWidth + x) * 4;
        rgba[output] = red;
        rgba[output + 1] = green;
        rgba[output + 2] = blue;
        rgba[output + 3] = samplesPerPixel === 2 || samplesPerPixel === 4
          ? view.getUint8(offset + samplesPerPixel - 1)
          : 255;
      }
    }

    return {
      width: outputWidth,
      height: outputHeight,
      sourceWidth: width,
      sourceHeight: height,
      rgba,
    };
  }

  return { decode };
});
