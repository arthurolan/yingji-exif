(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.YingjiCoordinates = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 来源：WGS-84 to GCJ-02 @MacStudio 项目中已实测的转换范围与算法。
  const PI = Math.PI;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;
  const X_PI = (PI * 3000.0) / 180.0;
  const ROUGH_CHINA_BOUNDS = {
    minLon: 72.004,
    maxLon: 137.8347,
    minLat: 0.8293,
    maxLat: 55.8271,
  };
  const MAINLAND_CONVERSION_POLYGONS = [
    [
      [73.5, 39.4], [75.2, 37.7], [74.9, 35.4], [78.5, 32.5],
      [79.2, 30.0], [81.0, 30.2], [83.5, 27.5], [88.8, 27.8],
      [92.7, 28.0], [95.2, 29.0], [97.5, 27.8], [98.7, 24.0],
      [101.0, 21.5], [105.0, 21.0], [108.6, 21.5], [111.7, 21.0],
      [114.3, 21.8], [116.0, 22.8], [118.5, 24.0], [119.8, 25.5],
      [121.5, 28.5], [122.5, 31.0], [121.8, 34.5], [124.3, 39.8],
      [126.0, 42.0], [130.8, 42.7], [134.8, 48.4], [132.0, 47.7],
      [130.5, 48.9], [127.5, 49.6], [124.0, 53.5], [120.0, 53.3],
      [117.0, 49.7], [111.0, 49.3], [105.0, 41.8], [96.5, 42.8],
      [92.0, 45.0], [87.5, 49.1], [82.0, 49.0], [79.0, 45.0],
      [73.5, 39.4],
    ],
    [[108.6, 18.0], [111.2, 18.0], [111.2, 20.2], [108.6, 20.2], [108.6, 18.0]],
  ];

  function isValidLonLat(lon, lat) {
    return Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= 90;
  }

  function isRoughChina(lon, lat) {
    return lon >= ROUGH_CHINA_BOUNDS.minLon && lon <= ROUGH_CHINA_BOUNDS.maxLon && lat >= ROUGH_CHINA_BOUNDS.minLat && lat <= ROUGH_CHINA_BOUNDS.maxLat;
  }

  function pointInPolygon(lon, lat, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function isMainlandConversionArea(lon, lat) {
    if (!isRoughChina(lon, lat)) return false;
    return MAINLAND_CONVERSION_POLYGONS.some((polygon) => pointInPolygon(lon, lat, polygon));
  }

  function transformLat(x, y) {
    let value = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    value += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
    value += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
    value += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
    return value;
  }

  function transformLon(x, y) {
    let value = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    value += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
    value += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
    value += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
    return value;
  }

  function wgs84ToGcj02(lon, lat) {
    if (!isValidLonLat(lon, lat)) throw new TypeError("经纬度超出合法范围");
    if (!isMainlandConversionArea(lon, lat)) return { lon, lat, shifted: false };
    let dLat = transformLat(lon - 105.0, lat - 35.0);
    let dLon = transformLon(lon - 105.0, lat - 35.0);
    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
    dLon = (dLon * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
    return { lon: lon + dLon, lat: lat + dLat, shifted: true };
  }

  function gcj02ToBd09(lon, lat) {
    const z = Math.sqrt(lon * lon + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
    const theta = Math.atan2(lat, lon) + 0.000003 * Math.cos(lon * X_PI);
    return { lon: z * Math.cos(theta) + 0.0065, lat: z * Math.sin(theta) + 0.006 };
  }

  function convertForMaps(lon, lat) {
    const wgs = { lon, lat };
    const gcjResult = wgs84ToGcj02(lon, lat);
    const gcj = { lon: gcjResult.lon, lat: gcjResult.lat };
    const bd = gcjResult.shifted ? gcj02ToBd09(gcj.lon, gcj.lat) : { ...wgs };
    return { wgs, gcj, bd, shifted: gcjResult.shifted };
  }

  function buildMapLinks(converted, appleMode) {
    const mapCoord = converted.shifted ? converted.gcj : converted.wgs;
    const baiduCoord = converted.shifted ? converted.bd : converted.wgs;
    const appleCoord = converted.shifted && appleMode === "china" ? converted.gcj : converted.wgs;
    const baiduCoordType = converted.shifted ? "bd09ll" : "wgs84";
    const label = encodeURIComponent("照片拍摄位置");
    const googleQuery = encodeURIComponent(`${converted.wgs.lat.toFixed(8)},${converted.wgs.lon.toFixed(8)}`);
    return {
      apple: `https://maps.apple.com/?ll=${appleCoord.lat.toFixed(8)},${appleCoord.lon.toFixed(8)}&q=${label}`,
      amap: `https://uri.amap.com/marker?position=${mapCoord.lon.toFixed(8)},${mapCoord.lat.toFixed(8)}&name=${label}&coordinate=gaode`,
      baidu: `https://api.map.baidu.com/marker?location=${baiduCoord.lat.toFixed(8)},${baiduCoord.lon.toFixed(8)}&title=${label}&content=${label}&output=html&coord_type=${baiduCoordType}&src=webapp.yingji.exif`,
      google: `https://www.google.com/maps/search/?api=1&query=${googleQuery}`,
    };
  }

  return {
    isMainlandConversionArea,
    wgs84ToGcj02,
    gcj02ToBd09,
    convertForMaps,
    buildMapLinks,
  };
});
