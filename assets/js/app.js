(function () {
  "use strict";

  const MAX_FILE_SIZE = 300 * 1024 * 1024;
  const MAX_PREVIEW_FILE_SIZE = 100 * 1024 * 1024;
  const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "jpe", "tif", "tiff", "webp", "png", "heic", "heif"]);
  const GROUP_LABELS = {
    exif: "EXIF", iptc: "IPTC", xmp: "XMP", icc: "ICC", gps: "GPS",
    file: "文件", jfif: "JFIF", composite: "综合", photoshop: "Photoshop", png: "PNG",
    makerNotes: "MakerNote", mpf: "MPF", pngFile: "PNG", pngText: "PNG 文本",
    riff: "WebP", gif: "GIF", thumbnail: "缩略图",
  };
  const MAP_NAMES = { apple: "苹果地图", amap: "高德地图", baidu: "百度地图", google: "谷歌地图" };

  const els = {
    dropZone: document.querySelector("#drop-zone"),
    fileInput: document.querySelector("#file-input"),
    chooseButton: document.querySelector("#choose-button"),
    status: document.querySelector("#status"),
    result: document.querySelector("#result"),
    resultFileName: document.querySelector("#result-file-name"),
    clearButton: document.querySelector("#clear-button"),
    previewImage: document.querySelector("#preview-image"),
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
    displayVisitCounter("正在读取累计访问…");
    try {
      displayVisitCounter(`累计访问 ${await loadVisitCount()} 次`);
    } catch (error) {
      displayVisitCounter("访问统计暂时无法加载");
    }
  }

  function setStatus(message, type) {
    els.status.textContent = message;
    els.status.dataset.type = type || "";
    els.status.hidden = !message;
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
    if (!milliseconds) return "未知";
    return new Intl.DateTimeFormat("zh-CN", {
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
    if (ArrayBuffer.isView(value)) return `[二进制数据 ${value.byteLength} 字节]`;
    if (value instanceof ArrayBuffer) return `[二进制数据 ${value.byteLength} 字节]`;
    if (Array.isArray(value)) {
      if (value.length > 40) return `[数组，共 ${value.length} 项]`;
      return value.map(stringifyValue).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      const simpleEntries = Object.entries(value).filter(([key]) => !["image", "base64"].includes(key));
      if (simpleEntries.length > 16) return `[对象，共 ${simpleEntries.length} 项]`;
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
      if (Math.abs(value - 1 / denominator) < 0.0005) return `1/${denominator} 秒`;
    }
    return `${Number(value.toFixed(3))} 秒`;
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
      return `${previewDimensions}（实际图像）；${metadataDimensions}（EXIF 记录）`;
    }
    return previewDimensions || metadataDimensions || null;
  }

  function formatEnum(tag, type) {
    const value = numericValue(tag);
    const description = readableTag(tag);
    const maps = {
      exposure: { 0: "自动曝光", 1: "手动曝光", 2: "自动包围曝光" },
      exposureProgram: { 0: "未定义", 1: "手动", 2: "程序自动", 3: "光圈优先", 4: "快门优先", 5: "创意程序", 6: "动作程序", 7: "人像模式", 8: "风景模式" },
      metering: { 0: "未知", 1: "平均测光", 2: "中央重点平均测光", 3: "点测光", 4: "多点测光", 5: "多区测光", 6: "局部测光", 255: "其他" },
      whiteBalance: { 0: "自动白平衡", 1: "手动白平衡" },
      orientation: { 1: "正常（左上）", 2: "水平镜像", 3: "旋转 180°", 4: "垂直镜像", 5: "镜像并顺时针旋转 90°", 6: "顺时针旋转 90°", 7: "镜像并逆时针旋转 90°", 8: "逆时针旋转 90°" },
      colorSpace: { 1: "sRGB", 65535: "未校准" },
    };
    if (value !== null && maps[type] && maps[type][value]) return maps[type][value];
    if (type === "flash" && description) {
      if (/did not fire/i.test(description)) return "未闪光";
      if (/fired/i.test(description)) return "已闪光";
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

  function showPreview(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    els.previewImage.hidden = true;
    els.previewFallback.hidden = true;
    els.previewFallback.textContent = "浏览器无法预览此格式，仍会尝试读取元数据";
    return new Promise((resolve) => {
      els.previewImage.onload = () => {
        els.previewImage.hidden = false;
        els.previewFallback.hidden = true;
        resolve({ width: els.previewImage.naturalWidth, height: els.previewImage.naturalHeight });
      };
      els.previewImage.onerror = () => {
        els.previewImage.hidden = true;
        els.previewFallback.hidden = false;
        resolve({ width: null, height: null });
      };
      els.previewImage.src = previewUrl;
    });
  }

  function skipLargeFilePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    els.previewImage.removeAttribute("src");
    els.previewImage.hidden = true;
    els.previewFallback.textContent = "图片超过 100 MB，已读取元数据但未生成预览";
    els.previewFallback.hidden = false;
    return { width: null, height: null };
  }

  function metadataCount(tags) {
    return Object.entries(tags).reduce((count, [groupName, group]) => {
      if (groupName === "thumbnail" || !group || typeof group !== "object") return count;
      return count + Object.keys(group).length;
    }, 0);
  }

  function hasExifMetadata(tags) {
    const groups = ["exif", "iptc", "xmp", "makerNotes", "gps"];
    return groups.some((name) => tags[name] && Object.keys(tags[name]).length > 0);
  }

  function renderMainMetadata(tags, dimensions) {
    const rows = [
      { label: "拍摄日期和时间", value: readableTag(findTag(tags, ["DateTimeOriginal", "DateCreated", "CreateDate", "DateTimeDigitized", "DateTime"])) },
      { label: "拍摄者 / 作者", value: readableTag(findTag(tags, ["Artist", "By-line", "Creator", "Author"])) },
      { label: "版权信息", value: readableTag(findTag(tags, ["Copyright", "CopyrightNotice", "Rights"])) },
      { label: "相机品牌", value: readableTag(findTag(tags, ["Make"])) },
      { label: "相机型号", value: readableTag(findTag(tags, ["Model"])) },
      { label: "镜头型号", value: readableTag(findTag(tags, ["LensModel", "Lens", "LensInfo"])) },
      { label: "实际焦距", value: formatMillimeters(findTag(tags, ["FocalLength"])) },
      { label: "35 mm 等效焦距", value: formatMillimeters(findTag(tags, ["FocalLengthIn35mmFilm", "FocalLengthIn35mmFormat"])) },
      { label: "光圈", value: formatAperture(findTag(tags, ["FNumber", "ApertureValue"])) },
      { label: "快门速度", value: formatExposure(findTag(tags, ["ExposureTime"])) },
      { label: "感光度", value: formatIso(findTag(tags, ["PhotographicSensitivity", "ISOSpeedRatings", "ISO"])) },
      { label: "曝光补偿", value: formatExposureBias(findTag(tags, ["ExposureBiasValue"])) },
      { label: "曝光模式", value: formatExposureMode(tags) },
      { label: "测光模式", value: formatEnum(findTag(tags, ["MeteringMode"]), "metering") },
      { label: "白平衡", value: formatEnum(findTag(tags, ["WhiteBalance"]), "whiteBalance") },
      { label: "闪光灯", value: formatEnum(findTag(tags, ["Flash"]), "flash") },
      { label: "像素尺寸", value: dimensions || formatDimensions(tags) },
      { label: "图像方向", value: formatEnum(findTag(tags, ["Orientation"]), "orientation") },
      { label: "色彩空间", value: formatEnum(findTag(tags, ["ColorSpace", "ProfileDescription"]), "colorSpace") },
      { label: "相机软件", value: readableTag(findTag(tags, ["Software"])) },
    ];
    addDefinitionList(els.mainMetadata, rows);
    const shown = els.mainMetadata.childElementCount;
    els.metadataSummary.textContent = shown ? `显示 ${shown} 项常用数据` : "未找到常用拍摄参数";
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
      const link = document.createElement("a");
      link.className = "map-link";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = MAP_NAMES[service];
      link.addEventListener("click", (event) => {
        const allowed = window.confirm(`即将把当前 GPS 坐标传给${MAP_NAMES[service]}并打开外部页面。是否继续？`);
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
      { label: "纬度（WGS-84）", value: currentGps.latitude.toFixed(8) },
      { label: "经度（WGS-84）", value: currentGps.longitude.toFixed(8) },
      { label: "海拔", value: currentGps.altitude === null ? null : `${Number(currentGps.altitude.toFixed(1))} m` },
      { label: "拍摄方向", value: direction },
      { label: "GPS 日期 / 时间（UTC）", value: gpsTime },
      { label: "坐标处理", value: convertedGps.shifted ? "位于大陆转换范围内" : "保留 WGS-84 原坐标" },
    ]);
    els.appleMode.hidden = !convertedGps.shifted;
    els.gpsPanel.hidden = false;
    renderMapLinks();
  }

  function renderAllMetadata(tags) {
    els.allMetadata.replaceChildren();
    let count = 0;
    for (const [groupName, group] of Object.entries(tags)) {
      if (!group || typeof group !== "object" || groupName === "thumbnail") continue;
      for (const [key, tag] of Object.entries(group)) {
        const display = readableTag(tag);
        if (!display) continue;
        const row = document.createElement("tr");
        for (const text of [GROUP_LABELS[groupName] || groupName, key, display]) {
          const cell = document.createElement("td");
          cell.textContent = text;
          row.append(cell);
        }
        els.allMetadata.append(row);
        count += 1;
      }
    }
    els.tagCount.textContent = `（${count} 项）`;
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
      const original = els.copyCoordinates.textContent;
      els.copyCoordinates.textContent = "已复制";
      window.setTimeout(() => { els.copyCoordinates.textContent = original; }, 1500);
    } catch (error) {
      setStatus(`无法自动复制，请手动复制：${text}`, "warning");
    }
  }

  function resetResult() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    currentGps = null;
    convertedGps = null;
    els.previewImage.removeAttribute("src");
    els.previewImage.hidden = true;
    els.previewFallback.hidden = true;
    els.result.hidden = true;
    els.gpsPanel.hidden = true;
    els.allMetadataPanel.open = false;
    els.fileInput.value = "";
    setStatus("", "");
  }

  async function processFile(file) {
    if (!file) return;
    const extension = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      resetResult();
      setStatus("无法读取：请选择 JPEG、TIFF、WebP、PNG 或 HEIC/HEIF 图片。", "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      resetResult();
      setStatus("文件超过 300 MB。为避免浏览器占用过多内存，本次未读取。", "error");
      return;
    }
    if (!window.ExifReader) {
      setStatus("EXIF 解析组件未能加载，请确认项目文件完整。", "error");
      return;
    }

    setStatus("正在本机读取图片与元数据…", "");
    els.result.hidden = true;
    try {
      const previewSkipped = file.size > MAX_PREVIEW_FILE_SIZE;
      const [tags, preview] = await Promise.all([
        ExifReader.load(file, { expanded: true, computed: true, async: true }),
        previewSkipped ? Promise.resolve(skipLargeFilePreview()) : showPreview(file),
      ]);
      const metadataDimensions = formatDimensions(tags);
      const previewDimensions = preview.width && preview.height ? `${preview.width} × ${preview.height} px` : null;
      const displayedDimensions = formatDimensionComparison(metadataDimensions, previewDimensions);
      els.resultFileName.textContent = file.name;
      addDefinitionList(els.fileInfo, [
        { label: "文件名", value: file.name },
        { label: "格式", value: readableTag(findTag(tags, ["FileType"])) || extension.toUpperCase() || "未知" },
        { label: "文件大小", value: formatBytes(file.size) },
        { label: "最后修改时间", value: formatFileDate(file.lastModified) },
        { label: "像素尺寸", value: displayedDimensions || "无法确定" },
      ]);
      renderMainMetadata(tags, displayedDimensions);
      renderGps(tags);
      renderAllMetadata(tags);
      els.result.hidden = false;

      const count = metadataCount(tags);
      if (hasExifMetadata(tags)) {
        const previewNote = previewSkipped ? " 图片超过 100 MB，已跳过预览以减少内存占用。" : "";
        setStatus(`读取成功：在本机解析到 ${count} 项元数据。${previewNote}`, "success");
      } else {
        const previewNote = previewSkipped ? " 图片超过 100 MB，已跳过预览。" : "";
        setStatus(`图片可以读取，但未发现 EXIF、IPTC 或 XMP 拍摄元数据。${previewNote}`, "warning");
      }
      els.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      els.result.hidden = true;
      const message = error && error.message ? error.message : "未知错误";
      setStatus(`文件或格式无法读取：${message}`, "error");
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
    if (files.length > 1) setStatus("首版一次只读取一张图片，已选择拖入的第一张。", "warning");
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
      setStatus(`本机测试样片无法载入：${error.message}`, "error");
    }
  }

  loadLocalTestSample();
})();
