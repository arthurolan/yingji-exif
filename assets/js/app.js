(function () {
  "use strict";

  const MAX_FILE_SIZE = 300 * 1024 * 1024;
  const MAX_RAW_FILE_SIZE = 150 * 1024 * 1024;
  const MAX_PREVIEW_FILE_SIZE = 100 * 1024 * 1024;
  const MIN_EMBEDDED_PREVIEW_DIMENSION = 320;
  const RAW_EXTENSIONS = new Set(["arw", "dng", "nef", "pef"]);
  const TIFF_EXTENSIONS = new Set(["tif", "tiff"]);
  const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "jpe", "tif", "tiff", "webp", "png", "heic", "heif", "arw", "dng", "nef", "pef"]);
  const GROUP_LABELS = {
    exif: "EXIF", iptc: "IPTC", xmp: "XMP", icc: "ICC", gps: "GPS",
    file: "文件", jfif: "JFIF", composite: "综合", photoshop: "Photoshop", png: "PNG",
    makerNotes: "MakerNote", mpf: "MPF", pngFile: "PNG", pngText: "PNG 文本",
    riff: "WebP", gif: "GIF", thumbnail: "缩略图",
  };
  const GROUP_LABELS_EN = { ...GROUP_LABELS, file: "File", composite: "Composite", pngText: "PNG text", thumbnail: "Thumbnail" };
  const MESSAGES = {
    "zh-CN": {
      pageTitle: "照片背后的EXIF数据",
      title: "影迹·EXIF",
      metaDescription: "影迹·EXIF：在本机浏览器内查看照片拍摄参数与 GPS 位置。",
      languageLabel: "界面语言",
      privacyBadge: "图片不上传，仅在本机解析",
      introCopy: "拖入或点击选择一张照片，查看相机、镜头、曝光参数与拍摄位置。原图不会离开你的设备。",
      dropTitle: "拖入图片",
      or: "或",
      chooseButton: "点击选择",
      formatNote: "支持 JPEG、PNG、WebP、HEIC/HEIF、TIFF、Sony ARW、Nikon NEF、Pentax PEF 与 DNG · 单张最大 300 MB",
      supportTitle: "支持格式说明",
      supportPreviewTitle: "元数据与预览",
      supportPreviewText: "JPEG、PNG、WebP 可在主流浏览器中预览，并读取文件中存在的元数据。",
      supportExtendedTitle: "扩展格式",
      supportExtendedText: "HEIC/HEIF、TIFF 可读取元数据；预览取决于浏览器与具体编码。常见的无压缩 8-bit TIFF 提供本地后备预览。",
      supportRawTitle: "RAW 格式",
      supportRawText: "Sony ARW、Nikon NEF、Pentax PEF 与 DNG 支持读取 EXIF、GPS 等元数据，不进行 RAW 显影；仅在文件含有可用 JPEG 缩略图时显示预览。RAW 单张最大 150 MB。",
      currentImage: "CURRENT IMAGE",
      clearButton: "退出照片",
      previewAlt: "当前图片预览",
      resultLabel: "图片元数据",
      fileInfoTitle: "文件信息",
      captureData: "CAPTURE DATA",
      mainDataTitle: "主要拍摄参数",
      location: "LOCATION",
      gpsTitle: "拍摄位置",
      copyCoordinates: "复制坐标",
      appleModeLegend: "苹果地图坐标模式",
      appleModeChina: "中国大陆网络",
      appleModeGlobal: "境外或代理网络",
      mapWarning: "只有点击地图按钮后，当前 GPS 坐标才会传给所选地图服务。",
      allMetadataSummary: "展开全部元数据",
      tableGroup: "分组",
      tableField: "字段",
      tableValue: "值",
      footerPrivacy: "影迹·EXIF 不修改原图，也不保存图片或元数据。",
      footerCredit: "© 2026 E.O创作",
      counterLoading: "正在读取累计访问…",
      counterValue: "累计访问 {count} 次",
      counterError: "访问统计暂时无法加载",
      unknown: "未知",
      cannotDetermine: "无法确定",
      binaryData: "[二进制数据 {count} 字节]",
      arrayItems: "[数组，共 {count} 项]",
      objectItems: "[对象，共 {count} 项]",
      seconds: "{value} 秒",
      actualImage: "实际图像",
      exifRecorded: "EXIF 记录",
      shownData: "显示 {count} 项常用数据",
      noCommonData: "未找到常用拍摄参数",
      latitude: "纬度（WGS-84）",
      longitude: "经度（WGS-84）",
      altitude: "海拔",
      captureDirection: "拍摄方向",
      gpsDateTime: "GPS 日期 / 时间（UTC）",
      coordinateHandling: "坐标处理",
      insideChina: "位于大陆转换范围内",
      keepWgs84: "保留 WGS-84 原坐标",
      tagsCount: "（{count} 项）",
      mapConfirm: "即将把当前 GPS 坐标传给{service}并打开外部页面。是否继续？",
      copied: "已复制",
      copyFailed: "无法自动复制，请手动复制：{coordinates}",
      unsupported: "无法读取：请选择 JPEG、TIFF、WebP、PNG、HEIC/HEIF、Sony ARW、Nikon NEF、Pentax PEF 或 DNG 图片。",
      tooLarge: "文件超过 {limit} MB。为避免浏览器占用过多内存，本次未读取。",
      parserMissing: "EXIF 解析组件未能加载，请确认项目文件完整。",
      reading: "正在本机读取图片与元数据…",
      previewUnavailable: "浏览器无法预览此格式，仍会尝试读取元数据",
      rawPreviewUnavailable: "RAW 文件未提供尺寸足够的 JPEG 预览；元数据已正常读取",
      tiffPreviewUnavailable: "此 TIFF 的编码暂不支持后备预览；元数据仍会继续读取",
      previewSkipped: "图片超过 100 MB，已读取元数据但未生成预览",
      success: "读取成功：在本机解析到 {count} 项元数据。{note}",
      successPreviewSkipped: "图片超过 100 MB，已跳过预览以减少内存占用。",
      noMetadata: "图片可以读取，但未发现 EXIF、IPTC 或 XMP 拍摄元数据。{note}",
      noMetadataPreviewSkipped: "图片超过 100 MB，已跳过预览。",
      readFailed: "文件或格式无法读取：{message}",
      oneFileOnly: "V1.1 一次只读取一张图片，已选择拖入的第一张。",
      sampleFailed: "本机测试样片无法载入：{message}",
      fileName: "文件名",
      format: "格式",
      fileSize: "文件大小",
      modifiedTime: "最后修改时间",
      pixelDimensions: "像素尺寸",
      mapApple: "苹果地图",
      mapAmap: "高德地图",
      mapBaidu: "百度地图",
      mapGoogle: "谷歌地图",
      mainLabels: ["拍摄日期和时间", "拍摄者 / 作者", "版权信息", "相机品牌", "相机型号", "镜头型号", "实际焦距", "35 mm 等效焦距", "光圈", "快门速度", "感光度", "曝光补偿", "曝光模式", "测光模式", "白平衡", "闪光灯", "像素尺寸", "色彩空间", "相机软件", "图像描述"],
      enum: {
        exposure: ["自动曝光", "手动曝光", "自动包围曝光"],
        exposureProgram: ["未定义", "手动", "程序自动", "光圈优先", "快门优先", "创意程序", "动作程序", "人像模式", "风景模式"],
        metering: { 0: "未知", 1: "平均测光", 2: "中央重点平均测光", 3: "点测光", 4: "多点测光", 5: "多区测光", 6: "局部测光", 255: "其他" },
        whiteBalance: ["自动白平衡", "手动白平衡"],
        orientation: { 1: "正常（左上）", 2: "水平镜像", 3: "旋转 180°", 4: "垂直镜像", 5: "镜像并顺时针旋转 90°", 6: "顺时针旋转 90°", 7: "镜像并逆时针旋转 90°", 8: "逆时针旋转 90°" },
        colorSpace: { 1: "sRGB", 65535: "未校准" },
        flashOff: "未闪光",
        flashOn: "已闪光",
      },
    },
    en: {
      pageTitle: "The data behind a photograph",
      title: "Yingji · EXIF — Photo Metadata Viewer",
      metaDescription: "Yingji · EXIF: view photo metadata and GPS locations privately in your browser.",
      languageLabel: "Interface language",
      privacyBadge: "No uploads — processed locally",
      introCopy: "Drop in a photo to inspect the camera, lens, exposure and location data. The original file never leaves your device.",
      dropTitle: "Drop an image",
      or: "or",
      chooseButton: "choose a file",
      formatNote: "JPEG, PNG, WebP, HEIC/HEIF, TIFF, Sony ARW, Nikon NEF, Pentax PEF and DNG · 300 MB maximum",
      supportTitle: "Format support",
      supportPreviewTitle: "Metadata and preview",
      supportPreviewText: "JPEG, PNG and WebP can be previewed in major browsers, with any embedded metadata read locally.",
      supportExtendedTitle: "Extended formats",
      supportExtendedText: "HEIC/HEIF and TIFF metadata can be read; preview depends on the browser and encoding. A local fallback covers common uncompressed 8-bit TIFF files.",
      supportRawTitle: "RAW formats",
      supportRawText: "Sony ARW, Nikon NEF, Pentax PEF and DNG support EXIF, GPS and other metadata. RAW data is not developed; a preview appears only when the file contains a usable JPEG thumbnail. RAW files are limited to 150 MB.",
      currentImage: "CURRENT IMAGE",
      clearButton: "Exit photo",
      previewAlt: "Current image preview",
      resultLabel: "Image metadata",
      fileInfoTitle: "File information",
      captureData: "CAPTURE DATA",
      mainDataTitle: "Main capture data",
      location: "LOCATION",
      gpsTitle: "Capture location",
      copyCoordinates: "Copy coordinates",
      appleModeLegend: "Apple Maps coordinate mode",
      appleModeChina: "Mainland China network",
      appleModeGlobal: "Outside China or proxy network",
      mapWarning: "The current GPS coordinates are sent to a map service only after you select its button.",
      allMetadataSummary: "Show all metadata",
      tableGroup: "Group",
      tableField: "Field",
      tableValue: "Value",
      footerPrivacy: "Yingji · EXIF does not alter the original file or store images or metadata.",
      footerCredit: "© 2026 Created by E.O",
      counterLoading: "Loading total visits…",
      counterValue: "{count} total visits",
      counterError: "Visit count is temporarily unavailable",
      unknown: "Unknown",
      cannotDetermine: "Cannot determine",
      binaryData: "[Binary data: {count} bytes]",
      arrayItems: "[Array: {count} items]",
      objectItems: "[Object: {count} items]",
      seconds: "{value} sec",
      actualImage: "actual image",
      exifRecorded: "EXIF record",
      shownData: "Showing {count} commonly used fields",
      noCommonData: "No common capture data found",
      latitude: "Latitude (WGS-84)",
      longitude: "Longitude (WGS-84)",
      altitude: "Altitude",
      captureDirection: "Capture direction",
      gpsDateTime: "GPS date / time (UTC)",
      coordinateHandling: "Coordinate handling",
      insideChina: "Inside the mainland China conversion area",
      keepWgs84: "Original WGS-84 coordinates retained",
      tagsCount: "({count} fields)",
      mapConfirm: "This will send the current GPS coordinates to {service} and open an external page. Continue?",
      copied: "Copied",
      copyFailed: "Automatic copy failed. Copy manually: {coordinates}",
      unsupported: "Unable to read this file. Choose a JPEG, TIFF, WebP, PNG, HEIC/HEIF, Sony ARW, Nikon NEF, Pentax PEF or DNG image.",
      tooLarge: "This file exceeds {limit} MB and was not read to prevent excessive browser memory use.",
      parserMissing: "The EXIF parser could not load. Check that the project files are complete.",
      reading: "Reading the image and metadata locally…",
      previewUnavailable: "This browser cannot preview the format; metadata will still be read",
      rawPreviewUnavailable: "The RAW file has no sufficiently large JPEG preview; metadata was read normally",
      tiffPreviewUnavailable: "This TIFF encoding is not supported by the fallback preview; metadata will still be read",
      previewSkipped: "The image is over 100 MB; metadata was read but no preview was generated",
      success: "Success: {count} metadata fields were parsed locally. {note}",
      successPreviewSkipped: "The image is over 100 MB, so preview was skipped to reduce memory use.",
      noMetadata: "The image is readable, but no EXIF, IPTC or XMP capture metadata was found. {note}",
      noMetadataPreviewSkipped: "The image is over 100 MB, so preview was skipped.",
      readFailed: "The file or format could not be read: {message}",
      oneFileOnly: "V1.1 reads one image at a time; the first dropped file was selected.",
      sampleFailed: "The local test sample could not be loaded: {message}",
      fileName: "File name",
      format: "Format",
      fileSize: "File size",
      modifiedTime: "Last modified",
      pixelDimensions: "Pixel dimensions",
      mapApple: "Apple Maps",
      mapAmap: "Amap",
      mapBaidu: "Baidu Maps",
      mapGoogle: "Google Maps",
      mainLabels: ["Date and time captured", "Photographer / author", "Copyright", "Camera maker", "Camera model", "Lens model", "Focal length", "35 mm equivalent focal length", "Aperture", "Shutter speed", "ISO", "Exposure compensation", "Exposure mode", "Metering mode", "White balance", "Flash", "Pixel dimensions", "Color space", "Camera software", "Image description"],
      enum: {
        exposure: ["Auto exposure", "Manual exposure", "Auto bracket"],
        exposureProgram: ["Not defined", "Manual", "Program AE", "Aperture priority", "Shutter priority", "Creative program", "Action program", "Portrait mode", "Landscape mode"],
        metering: { 0: "Unknown", 1: "Average", 2: "Center-weighted average", 3: "Spot", 4: "Multi-spot", 5: "Multi-segment", 6: "Partial", 255: "Other" },
        whiteBalance: ["Auto white balance", "Manual white balance"],
        orientation: { 1: "Normal (top-left)", 2: "Mirrored horizontally", 3: "Rotated 180°", 4: "Mirrored vertically", 5: "Mirrored and rotated 90° clockwise", 6: "Rotated 90° clockwise", 7: "Mirrored and rotated 90° counter-clockwise", 8: "Rotated 90° counter-clockwise" },
        colorSpace: { 1: "sRGB", 65535: "Uncalibrated" },
        flashOff: "Flash did not fire",
        flashOn: "Flash fired",
      },
    },
  };

  const els = {
    languageGroup: document.querySelector(".language-switch"),
    languageButtons: [...document.querySelectorAll(".language-button")],
    metaDescription: document.querySelector("#meta-description"),
    dropZone: document.querySelector("#drop-zone"),
    fileInput: document.querySelector("#file-input"),
    chooseButton: document.querySelector("#choose-button"),
    status: document.querySelector("#status"),
    result: document.querySelector("#result"),
    resultFileName: document.querySelector("#result-file-name"),
    clearButton: document.querySelector("#clear-button"),
    previewImage: document.querySelector("#preview-image"),
    previewCanvas: document.querySelector("#preview-canvas"),
    previewFallback: document.querySelector("#preview-fallback"),
    fileInfo: document.querySelector("#file-info"),
    mainMetadata: document.querySelector("#main-metadata"),
    metadataSummary: document.querySelector("#metadata-summary"),
    gpsPanel: document.querySelector("#gps-panel"),
    gpsData: document.querySelector("#gps-data"),
    copyCoordinates: document.querySelector("#copy-coordinates"),
    appleMode: document.querySelector("#apple-mode"),
    mapLinks: document.querySelector("#map-links"),
    allMetadata: document.querySelector("#all-metadata"),
    allMetadataPanel: document.querySelector("#all-metadata-panel"),
    tagCount: document.querySelector("#tag-count"),
    visitCounterTrigger: document.querySelector("#visit-counter-trigger"),
    visitCounterBubble: document.querySelector("#visit-counter-bubble"),
  };

  let previewUrl = null;
  let currentGps = null;
  let convertedGps = null;
  let visitCountPromise = null;
  let visitCounterTimer = null;
  let currentLanguage = "zh-CN";
  let currentStatus = null;
  let currentResult = null;

  function template(text, variables) {
    return String(text).replace(/\{(\w+)\}/g, (match, key) => variables && variables[key] !== undefined ? variables[key] : "");
  }

  function t(key, variables) {
    return template(MESSAGES[currentLanguage][key] ?? MESSAGES["zh-CN"][key] ?? key, variables);
  }

  function getPreferredLanguage() {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    if (queryLanguage && /^en(?:-|$)/i.test(queryLanguage)) return "en";
    if (queryLanguage && /^zh(?:-|$)/i.test(queryLanguage)) return "zh-CN";
    try {
      return window.localStorage.getItem("yingji-exif-language") === "en" ? "en" : "zh-CN";
    } catch (error) {
      return "zh-CN";
    }
  }

  function setStatusMessage(key, variables, type) {
    currentStatus = key ? { key, variables: variables || {}, type: type || "" } : null;
    const renderedVariables = { ...(variables || {}) };
    if (renderedVariables.noteKey) renderedVariables.note = t(renderedVariables.noteKey);
    els.status.textContent = key ? t(key, renderedVariables) : "";
    els.status.dataset.type = type || "";
    els.status.hidden = !key;
  }

  function applyLanguage(language, persist) {
    currentLanguage = language === "en" ? "en" : "zh-CN";
    document.documentElement.lang = currentLanguage;
    document.title = t("title");
    els.metaDescription.content = t("metaDescription");
    els.languageGroup.setAttribute("aria-label", t("languageLabel"));
    document.querySelector("#result").setAttribute("aria-label", t("resultLabel"));
    els.previewImage.alt = t("previewAlt");
    els.previewCanvas.setAttribute("aria-label", t("previewAlt"));
    for (const element of document.querySelectorAll("[data-i18n]")) element.textContent = t(element.dataset.i18n);
    for (const button of els.languageButtons) button.setAttribute("aria-pressed", String(button.dataset.language === currentLanguage));
    if (persist) {
      try { window.localStorage.setItem("yingji-exif-language", currentLanguage); } catch (error) { /* Storage may be unavailable in private mode. */ }
    }
    if (currentResult) renderCurrentResult();
    if (currentStatus) setStatusMessage(currentStatus.key, currentStatus.variables, currentStatus.type);
  }

  function hideVisitCounter() {
    els.visitCounterBubble.hidden = true;
    els.visitCounterTrigger.setAttribute("aria-expanded", "false");
  }

  function displayVisitCounter(message) {
    window.clearTimeout(visitCounterTimer);
    els.visitCounterBubble.textContent = message;
    els.visitCounterBubble.hidden = false;
    els.visitCounterTrigger.setAttribute("aria-expanded", "true");
    visitCounterTimer = window.setTimeout(hideVisitCounter, 3000);
  }

  function loadVisitCount() {
    if (!visitCountPromise) {
      visitCountPromise = fetch("https://yingji-exif-arthurolan.goatcounter.com/counter/TOTAL.json", { mode: "cors" })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (!data || typeof data.count !== "string" || !data.count.trim()) throw new Error("invalid response");
          return data.count.trim();
        })
        .catch((error) => {
          visitCountPromise = null;
          throw error;
        });
    }
    return visitCountPromise;
  }

  async function showVisitCounter() {
    displayVisitCounter(t("counterLoading"));
    try {
      displayVisitCounter(t("counterValue", { count: await loadVisitCount() }));
    } catch (error) {
      displayVisitCounter(t("counterError"));
    }
  }

  function getExtension(fileName) {
    return fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB"];
    let value = bytes;
    let unit = "B";
    for (const nextUnit of units) {
      value /= 1024;
      unit = nextUnit;
      if (value < 1024) break;
    }
    return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${unit}`;
  }

  function formatFileDate(milliseconds) {
    if (!milliseconds) return t("unknown");
    return new Intl.DateTimeFormat(currentLanguage, {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(new Date(milliseconds));
  }

  function unwrapTag(tag, preferDescription) {
    if (tag === undefined || tag === null) return null;
    if (typeof tag !== "object" || Array.isArray(tag)) return tag;
    if (preferDescription && tag.description !== undefined && tag.description !== "") return tag.description;
    if (tag.computed !== undefined) return tag.computed;
    if (tag.value !== undefined) return tag.value;
    if (tag.description !== undefined) return tag.description;
    return null;
  }

  function findTag(tags, names) {
    const groupOrder = ["exif", "iptc", "xmp", "file", "jfif", "png", "pngFile", "riff", "gif", "composite", "makerNotes"];
    for (const name of names) {
      for (const groupName of groupOrder) {
        const group = tags[groupName];
        if (group && Object.prototype.hasOwnProperty.call(group, name)) return group[name];
      }
    }
    return null;
  }

  function numericValue(tag) {
    if (tag === undefined || tag === null) return null;
    let value = unwrapTag(tag, false);
    if (value === undefined || value === null || value === "") return null;
    if (Array.isArray(value) && value.length === 1) [value] = value;
    if (Array.isArray(value) && value.length === 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])) && Number(value[1]) !== 0) {
      value = Number(value[0]) / Number(value[1]);
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function readableTag(tag) {
    const value = unwrapTag(tag, true);
    return stringifyValue(value);
  }

  function stringifyValue(value) {
    if (value === undefined || value === null || value === "") return null;
    if (value instanceof Date) return value.toISOString().replace("T", " ").replace(".000Z", "");
    if (ArrayBuffer.isView(value)) return t("binaryData", { count: value.byteLength });
    if (value instanceof ArrayBuffer) return t("binaryData", { count: value.byteLength });
    if (Array.isArray(value)) {
      if (value.length > 40) return t("arrayItems", { count: value.length });
      return value.map(stringifyValue).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      const simpleEntries = Object.entries(value).filter(([key]) => !["image", "base64"].includes(key));
      if (simpleEntries.length > 16) return t("objectItems", { count: simpleEntries.length });
      return simpleEntries.map(([key, child]) => `${key}: ${stringifyValue(child) || "—"}`).join("；");
    }
    const text = String(value).replace(/\u0000/g, "").trim();
    return text || null;
  }

  function formatExposure(tag) {
    const value = numericValue(tag);
    if (value === null || value <= 0) return readableTag(tag);
    if (value < 1) {
      const denominator = Math.round(1 / value);
      if (Math.abs(value - 1 / denominator) < 0.0005) return t("seconds", { value: `1/${denominator}` });
    }
    return t("seconds", { value: Number(value.toFixed(3)) });
  }

  function formatAperture(tag) {
    const value = numericValue(tag);
    return value === null ? readableTag(tag) : `f/${Number(value.toFixed(1))}`;
  }

  function formatMillimeters(tag) {
    const value = numericValue(tag);
    return value === null ? readableTag(tag) : `${Number(value.toFixed(1))} mm`;
  }

  function formatIso(tag) {
    const value = numericValue(tag);
    return value === null ? readableTag(tag) : `ISO ${Math.round(value)}`;
  }

  function formatExposureBias(tag) {
    const value = numericValue(tag);
    if (value === null) return readableTag(tag);
    const rounded = Number(value.toFixed(2));
    return `${rounded > 0 ? "+" : ""}${rounded} EV`;
  }

  function formatDimensions(tags) {
    const widthTag = findTag(tags, ["PixelXDimension", "ImageWidth", "Image Width"]);
    const heightTag = findTag(tags, ["PixelYDimension", "ImageHeight", "Image Height"]);
    const width = numericValue(widthTag);
    const height = numericValue(heightTag);
    return width && height ? `${Math.round(width)} × ${Math.round(height)} px` : null;
  }

  function formatDimensionComparison(metadataDimensions, previewDimensions) {
    if (metadataDimensions && previewDimensions && metadataDimensions !== previewDimensions) {
      return `${previewDimensions} (${t("actualImage")}); ${metadataDimensions} (${t("exifRecorded")})`;
    }
    return previewDimensions || metadataDimensions || null;
  }

  function formatEnum(tag, type) {
    const value = numericValue(tag);
    const description = readableTag(tag);
    const maps = MESSAGES[currentLanguage].enum;
    if (value !== null && maps[type] && maps[type][value]) return maps[type][value];
    if (type === "flash" && description) {
      if (/did not fire/i.test(description)) return maps.flashOff;
      if (/fired/i.test(description)) return maps.flashOn;
    }
    return description;
  }

  function formatExposureMode(tags) {
    const mode = findTag(tags, ["ExposureMode"]);
    return mode ? formatEnum(mode, "exposure") : formatEnum(findTag(tags, ["ExposureProgram"]), "exposureProgram");
  }

  function addDefinitionList(container, rows) {
    container.replaceChildren();
    for (const row of rows) {
      if (row.value === null || row.value === undefined || row.value === "") continue;
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = row.label;
      dd.textContent = row.value;
      wrapper.append(dt, dd);
      container.append(wrapper);
    }
  }

  function clearPreviewDisplay() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    els.previewImage.removeAttribute("src");
    els.previewImage.hidden = true;
    els.previewCanvas.hidden = true;
    els.previewCanvas.width = 0;
    els.previewCanvas.height = 0;
    els.previewFallback.hidden = true;
  }

  function showImageBlob(blob, minimumDimension) {
    clearPreviewDisplay();
    previewUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      els.previewImage.onload = () => {
        const width = els.previewImage.naturalWidth;
        const height = els.previewImage.naturalHeight;
        if (minimumDimension && Math.max(width, height) < minimumDimension) {
          clearPreviewDisplay();
          resolve({ width: null, height: null, shown: false });
          return;
        }
        els.previewImage.hidden = false;
        els.previewFallback.hidden = true;
        resolve({ width, height, shown: true });
      };
      els.previewImage.onerror = () => {
        clearPreviewDisplay();
        resolve({ width: null, height: null, shown: false });
      };
      els.previewImage.src = previewUrl;
    });
  }

  async function showNativePreview(file) {
    els.previewFallback.textContent = t("previewUnavailable");
    const preview = await showImageBlob(file, 0);
    if (!preview.shown) {
      els.previewFallback.textContent = t("previewUnavailable");
      els.previewFallback.hidden = false;
    }
    return preview;
  }

  function thumbnailGroup(tags) {
    return tags.Thumbnail || tags.thumbnail || null;
  }

  async function showEmbeddedJpegPreview(file, tags) {
    const group = thumbnailGroup(tags);
    if (!group) return { width: null, height: null, shown: false };
    let blob = null;
    const image = group.image;
    if (ArrayBuffer.isView(image)) blob = new Blob([image], { type: "image/jpeg" });
    if (image instanceof ArrayBuffer) blob = new Blob([image], { type: "image/jpeg" });
    if (!blob && typeof group.base64 === "string" && group.base64) {
      const source = group.base64.includes(",") ? group.base64.split(",").pop() : group.base64;
      try {
        const binary = window.atob(source);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        blob = new Blob([bytes], { type: "image/jpeg" });
      } catch (error) { /* Fall back to TIFF thumbnail offsets. */ }
    }
    if (!blob) {
      const offset = numericValue(group.JPEGInterchangeFormat);
      const length = numericValue(group.JPEGInterchangeFormatLength);
      if (offset !== null && length !== null && offset >= 0 && length > 0 && offset + length <= file.size) {
        blob = file.slice(offset, offset + length, "image/jpeg");
      }
    }
    return blob ? showImageBlob(blob, MIN_EMBEDDED_PREVIEW_DIMENSION) : { width: null, height: null, shown: false };
  }

  async function showTiffFallback(file) {
    if (!window.YingjiTiffPreview) return { width: null, height: null, shown: false };
    const decoded = window.YingjiTiffPreview.decode(await file.arrayBuffer(), 1800);
    clearPreviewDisplay();
    els.previewCanvas.width = decoded.width;
    els.previewCanvas.height = decoded.height;
    const context = els.previewCanvas.getContext("2d");
    const pixels = context.createImageData(decoded.width, decoded.height);
    pixels.data.set(decoded.rgba);
    context.putImageData(pixels, 0, 0);
    els.previewCanvas.hidden = false;
    return { width: decoded.sourceWidth, height: decoded.sourceHeight, shown: true };
  }

  async function showFallbackPreview(file, tags, extension) {
    if (RAW_EXTENSIONS.has(extension)) {
      const preview = await showEmbeddedJpegPreview(file, tags);
      if (!preview.shown) {
        els.previewFallback.textContent = t("rawPreviewUnavailable");
        els.previewFallback.hidden = false;
      }
      return preview;
    }
    if (TIFF_EXTENSIONS.has(extension)) {
      try {
        return await showTiffFallback(file);
      } catch (error) {
        els.previewFallback.textContent = t("tiffPreviewUnavailable");
        els.previewFallback.hidden = false;
      }
    }
    return { width: null, height: null, shown: false };
  }

  function skipLargeFilePreview() {
    clearPreviewDisplay();
    els.previewFallback.textContent = t("previewSkipped");
    els.previewFallback.hidden = false;
    return { width: null, height: null, shown: false };
  }

  function metadataCount(tags) {
    return Object.entries(tags).reduce((count, [groupName, group]) => {
      if (groupName.toLowerCase() === "thumbnail" || !group || typeof group !== "object") return count;
      return count + Object.keys(group).length;
    }, 0);
  }

  function hasExifMetadata(tags) {
    const groups = ["exif", "iptc", "xmp", "makerNotes", "gps"];
    return groups.some((name) => tags[name] && Object.keys(tags[name]).length > 0);
  }

  function renderMainMetadata(tags, dimensions) {
    const values = [
      readableTag(findTag(tags, ["DateTimeOriginal", "DateCreated", "CreateDate", "DateTimeDigitized", "DateTime"])),
      readableTag(findTag(tags, ["Artist", "By-line", "Creator", "Author"])),
      readableTag(findTag(tags, ["Copyright", "CopyrightNotice", "Rights"])),
      readableTag(findTag(tags, ["Make"])),
      readableTag(findTag(tags, ["Model"])),
      readableTag(findTag(tags, ["LensModel", "Lens", "LensInfo"])),
      formatMillimeters(findTag(tags, ["FocalLength"])),
      formatMillimeters(findTag(tags, ["FocalLengthIn35mmFilm", "FocalLengthIn35mmFormat"])),
      formatAperture(findTag(tags, ["FNumber", "ApertureValue"])),
      formatExposure(findTag(tags, ["ExposureTime"])),
      formatIso(findTag(tags, ["PhotographicSensitivity", "ISOSpeedRatings", "ISO"])),
      formatExposureBias(findTag(tags, ["ExposureBiasValue"])),
      formatExposureMode(tags),
      formatEnum(findTag(tags, ["MeteringMode"]), "metering"),
      formatEnum(findTag(tags, ["WhiteBalance"]), "whiteBalance"),
      formatEnum(findTag(tags, ["Flash"]), "flash"),
      dimensions || formatDimensions(tags),
      formatEnum(findTag(tags, ["ColorSpace", "ProfileDescription"]), "colorSpace"),
      readableTag(findTag(tags, ["Software"])),
      readableTag(findTag(tags, ["ImageDescription"])),
    ];
    const rows = MESSAGES[currentLanguage].mainLabels.map((label, index) => ({ label, value: values[index] }));
    addDefinitionList(els.mainMetadata, rows);
    const shown = els.mainMetadata.childElementCount;
    els.metadataSummary.textContent = shown ? t("shownData", { count: shown }) : t("noCommonData");
  }

  function gpsNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    return numericValue(value);
  }

  function extractGps(tags) {
    const latitude = tags.gps ? gpsNumber(tags.gps.Latitude) : null;
    const longitude = tags.gps ? gpsNumber(tags.gps.Longitude) : null;
    const altitude = tags.gps ? gpsNumber(tags.gps.Altitude) : null;
    if (latitude === null || longitude === null) return null;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude, altitude };
  }

  function renderMapLinks() {
    if (!convertedGps) return;
    const mode = document.querySelector('input[name="apple-map-mode"]:checked')?.value || "china";
    const links = YingjiCoordinates.buildMapLinks(convertedGps, mode);
    els.mapLinks.replaceChildren();
    for (const [service, href] of Object.entries(links)) {
      const serviceName = t(`map${service[0].toUpperCase()}${service.slice(1)}`);
      const link = document.createElement("a");
      link.className = "map-link";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = serviceName;
      link.addEventListener("click", (event) => {
        const allowed = window.confirm(t("mapConfirm", { service: serviceName }));
        if (!allowed) event.preventDefault();
      });
      els.mapLinks.append(link);
    }
  }

  function renderGps(tags) {
    currentGps = extractGps(tags);
    convertedGps = null;
    if (!currentGps) {
      els.gpsPanel.hidden = true;
      return;
    }
    convertedGps = YingjiCoordinates.convertForMaps(currentGps.longitude, currentGps.latitude);
    const directionTag = findTag(tags, ["GPSImgDirection"]);
    const directionNumber = numericValue(directionTag);
    const direction = directionNumber === null ? readableTag(directionTag) : `${Number(directionNumber.toFixed(1))}°`;
    const gpsDate = readableTag(findTag(tags, ["GPSDateStamp"]));
    const gpsClock = readableTag(findTag(tags, ["GPSTimeStamp"]));
    const gpsTime = [gpsDate, gpsClock].filter(Boolean).join(" ") || null;
    addDefinitionList(els.gpsData, [
      { label: t("latitude"), value: currentGps.latitude.toFixed(8) },
      { label: t("longitude"), value: currentGps.longitude.toFixed(8) },
      { label: t("altitude"), value: currentGps.altitude === null ? null : `${Number(currentGps.altitude.toFixed(1))} m` },
      { label: t("captureDirection"), value: direction },
      { label: t("gpsDateTime"), value: gpsTime },
      { label: t("coordinateHandling"), value: convertedGps.shifted ? t("insideChina") : t("keepWgs84") },
    ]);
    els.appleMode.hidden = !convertedGps.shifted;
    els.gpsPanel.hidden = false;
    renderMapLinks();
  }

  function renderAllMetadata(tags) {
    els.allMetadata.replaceChildren();
    let count = 0;
    for (const [groupName, group] of Object.entries(tags)) {
      if (!group || typeof group !== "object" || groupName.toLowerCase() === "thumbnail") continue;
      for (const [key, tag] of Object.entries(group)) {
        const display = readableTag(tag);
        if (!display) continue;
        const row = document.createElement("tr");
        const groupLabels = currentLanguage === "en" ? GROUP_LABELS_EN : GROUP_LABELS;
        for (const text of [groupLabels[groupName] || groupName, key, display]) {
          const cell = document.createElement("td");
          cell.textContent = text;
          row.append(cell);
        }
        els.allMetadata.append(row);
        count += 1;
      }
    }
    els.tagCount.textContent = t("tagsCount", { count });
  }

  async function copyCoordinates() {
    if (!currentGps) return;
    const text = `${currentGps.latitude.toFixed(8)}, ${currentGps.longitude.toFixed(8)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        if (!document.execCommand("copy")) throw new Error("copy failed");
        textarea.remove();
      }
      els.copyCoordinates.textContent = t("copied");
      window.setTimeout(() => { els.copyCoordinates.textContent = t("copyCoordinates"); }, 1500);
    } catch (error) {
      setStatusMessage("copyFailed", { coordinates: text }, "warning");
    }
  }

  function resetResult() {
    clearPreviewDisplay();
    currentGps = null;
    convertedGps = null;
    currentResult = null;
    els.result.hidden = true;
    els.gpsPanel.hidden = true;
    els.allMetadataPanel.open = false;
    els.fileInput.value = "";
    setStatusMessage("", {}, "");
  }

  function displayFormat(tags, extension) {
    if (extension === "arw") return "Sony ARW";
    if (extension === "dng") return "DNG";
    if (extension === "nef") return "Nikon NEF";
    if (extension === "pef") return "Pentax PEF";
    if (TIFF_EXTENSIONS.has(extension)) return "TIFF";
    return readableTag(findTag(tags, ["FileType"])) || extension.toUpperCase() || t("unknown");
  }

  function renderCurrentResult() {
    if (!currentResult) return;
    const { file, extension, tags, displayedDimensions, previewMessageKey } = currentResult;
    els.resultFileName.textContent = file.name;
    addDefinitionList(els.fileInfo, [
      { label: t("fileName"), value: file.name },
      { label: t("format"), value: displayFormat(tags, extension) },
      { label: t("fileSize"), value: formatBytes(file.size) },
      { label: t("modifiedTime"), value: formatFileDate(file.lastModified) },
      { label: t("pixelDimensions"), value: displayedDimensions || t("cannotDetermine") },
    ]);
    renderMainMetadata(tags, displayedDimensions);
    renderGps(tags);
    renderAllMetadata(tags);
    if (!els.previewFallback.hidden && previewMessageKey) els.previewFallback.textContent = t(previewMessageKey);
  }

  async function processFile(file) {
    if (!file) return;
    const extension = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      resetResult();
      setStatusMessage("unsupported", {}, "error");
      return;
    }
    const sizeLimit = RAW_EXTENSIONS.has(extension) ? MAX_RAW_FILE_SIZE : MAX_FILE_SIZE;
    if (file.size > sizeLimit) {
      resetResult();
      setStatusMessage("tooLarge", { limit: sizeLimit / 1024 / 1024 }, "error");
      return;
    }
    if (!window.ExifReader) {
      setStatusMessage("parserMissing", {}, "error");
      return;
    }

    setStatusMessage("reading", {}, "");
    els.result.hidden = true;
    try {
      const previewSkipped = file.size > MAX_PREVIEW_FILE_SIZE;
      const [tags, nativePreview] = await Promise.all([
        ExifReader.load(file, { expanded: true, computed: true, async: true }),
        previewSkipped ? Promise.resolve(skipLargeFilePreview()) : showNativePreview(file),
      ]);
      let preview = nativePreview;
      if (!previewSkipped && !nativePreview.shown) preview = await showFallbackPreview(file, tags, extension);
      const metadataDimensions = formatDimensions(tags);
      const previewDimensions = preview.width && preview.height ? `${preview.width} × ${preview.height} px` : null;
      const displayedDimensions = formatDimensionComparison(metadataDimensions, previewDimensions);
      const previewMessageKey = previewSkipped
        ? "previewSkipped"
        : (!preview.shown && RAW_EXTENSIONS.has(extension) ? "rawPreviewUnavailable"
          : (!preview.shown && TIFF_EXTENSIONS.has(extension) ? "tiffPreviewUnavailable" : "previewUnavailable"));
      currentResult = { file, extension, tags, displayedDimensions, previewMessageKey };
      renderCurrentResult();
      els.result.hidden = false;

      const count = metadataCount(tags);
      if (hasExifMetadata(tags)) {
        setStatusMessage("success", { count, noteKey: previewSkipped ? "successPreviewSkipped" : "" }, "success");
      } else {
        setStatusMessage("noMetadata", { noteKey: previewSkipped ? "noMetadataPreviewSkipped" : "" }, "warning");
      }
      els.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      els.result.hidden = true;
      currentResult = null;
      const message = error && error.message ? error.message : t("unknown");
      setStatusMessage("readFailed", { message }, "error");
    }
  }

  els.chooseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    els.fileInput.click();
  });
  els.dropZone.addEventListener("click", (event) => {
    if (event.target !== els.chooseButton) els.fileInput.click();
  });
  els.fileInput.addEventListener("change", () => processFile(els.fileInput.files[0]));
  els.clearButton.addEventListener("click", resetResult);
  els.copyCoordinates.addEventListener("click", copyCoordinates);
  els.appleMode.addEventListener("change", renderMapLinks);
  els.visitCounterTrigger.addEventListener("mouseenter", showVisitCounter);
  els.visitCounterTrigger.addEventListener("focus", showVisitCounter);
  els.visitCounterTrigger.addEventListener("click", showVisitCounter);
  els.visitCounterTrigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showVisitCounter();
    } else if (event.key === "Escape") {
      hideVisitCounter();
    }
  });
  for (const button of els.languageButtons) {
    button.addEventListener("click", () => applyLanguage(button.dataset.language, true));
  }

  for (const eventName of ["dragenter", "dragover"]) {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("is-dragging");
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    });
  }
  for (const eventName of ["dragleave", "dragend"]) {
    els.dropZone.addEventListener(eventName, () => els.dropZone.classList.remove("is-dragging"));
  }
  els.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("is-dragging");
    const files = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
    if (files.length > 1) setStatusMessage("oneFileOnly", {}, "warning");
    processFile(files[0]);
  });

  async function loadLocalTestSample() {
    if (!new Set(["127.0.0.1", "localhost"]).has(window.location.hostname)) return;
    const sampleName = new URLSearchParams(window.location.search).get("sample");
    if (!sampleName || sampleName.includes("/") || sampleName.includes("\\")) return;
    try {
      const response = await fetch(`./${encodeURIComponent(sampleName)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const sampleFile = new File([blob], sampleName, { type: blob.type, lastModified: Date.now() });
      await processFile(sampleFile);
    } catch (error) {
      setStatusMessage("sampleFailed", { message: error.message }, "error");
    }
  }

  applyLanguage(getPreferredLanguage(), false);
  loadLocalTestSample();
})();
