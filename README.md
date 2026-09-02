# 影迹·EXIF

影迹·EXIF 是一个面向摄影者的本地 EXIF 查看工具。用户拖入或选择一张图片后，网页会在当前浏览器内读取拍摄参数；若照片含有 GPS，还可以复制坐标或主动打开苹果、高德、百度、谷歌地图。

## 当前状态

V1.1 已在本地开发和测试，尚未提交、推送或发布。目前已经具备：

- 单张图片拖放与点击选择；
- 本地解析 EXIF、IPTC、XMP 等元数据；
- 文件预览、文件属性、主要摄影参数和全部元数据表；
- GPS 坐标、海拔、拍摄方向、复制坐标；
- 中国大陆坐标转换和四种地图链接；
- 无元数据、不支持格式、损坏文件三类状态提示；
- 中文 / English 单页切换，并记住上次选择；
- Sony ARW、Nikon NEF、Pentax PEF、DNG、HEIC/HEIF 与 TIFF 元数据读取入口；
- HEIC/HEIF 浏览器原生优先预览、常见无压缩 8-bit TIFF 本地后备预览；
- RAW 内嵌 JPEG 预览筛选，不进行 RAW 显影；
- 普通图片 300 MB、RAW 150 MB 读取上限，超过 100 MB 时跳过预览；
- 退出照片和响应式界面。

JPEG 仍是必须稳定支持的基线。PNG、WebP 的预览取决于浏览器原生能力；HEIC/HEIF 的元数据可读，但预览取决于浏览器与具体编码；TIFF 后备预览目前只覆盖常见无压缩 8-bit RGB / 灰度文件；ARW、NEF、PEF、DNG 只承诺读取文件中实际存在的元数据，不承诺 RAW 全尺寸显影。

## 使用方法

直接双击 `index.html`，或把本目录作为普通静态网站发布。页面不依赖外部 CDN；核心读取流程不需要把图片上传到服务器。

## 项目结构

- `index.html`：网页入口。
- `assets/css/style.css`：界面样式。
- `assets/js/app.js`：文件读取、元数据整理和页面交互。
- `assets/js/coordinates.js`：坐标范围判断、WGS-84 / GCJ-02 / BD-09 转换和地图链接。
- `assets/js/tiff-preview.js`：V1.1 的轻量 TIFF 基线后备预览。
- `assets/vendor/exifreader/`：本地化的第三方解析库及许可证。
- `tests/`：不依赖浏览器的基础自动测试。
- `docs/TESTING.md`：真实样本与浏览器测试清单。
- `docs/SAMPLE-TEST-2026-07-17.md`：首批六张真实 JPEG 样片的验证结果与修复记录。
- `docs/SAMPLE-TEST-V1.1-2026-07-22.md`：ARW、DNG、HEIC 和 TIFF 样片的本地验证结果。
- `图片EXIF项目.md`：保留不动的原始构思记录。
- `AGENTS.md`：已确认定稿的项目协作与产品规则。

## 隐私边界

图片只通过浏览器标准的 `File` / `Blob` 接口读取，不修改原图。预览使用临时对象地址，退出照片时会释放。只有用户主动点击地图按钮并再次确认后，GPS 坐标才会传给相应地图服务。

## 第三方组件

元数据解析采用 ExifReader 4.41.0，浏览器脚本已随项目本地保存。许可证与来源见 `THIRD_PARTY_NOTICES.md`。

坐标转换逻辑来自本机既有项目 `WGS-84 to GCJ-02 @MacStudio` 中已经测试过的实现，本项目保留了来源注释与独立测试。

## 开发检查

安装 Node.js 后可运行：

```bash
npm test
```

自动测试只能覆盖坐标算法等确定性逻辑，不能代替 `docs/TESTING.md` 中的真实照片和跨浏览器验证。

2026 年 7 月 17 日已完成首批六张真实 JPEG 样片的解析与浏览器回归测试。2026 年 7 月 22 日又以 ARW、DNG、NEF、PEF、HEIC、TIFF 各一张进行 V1.1 本地验证。样片因可能包含作者、版权和精确 GPS，默认不纳入 Git。

## 源码与维护

本项目是影迹·EXIF 唯一的功能源码和开发维护地点：

`https://github.com/arthurolan/yingji-exif`

以后如需修改元数据读取、格式支持、GPS/地图逻辑、界面交互、测试或版本说明，应在本项目中修改、测试、提交和推送。

E.O图文网站仅提供本 GitHub 项目的链接，不再生成、部署或维护影迹·EXIF 的站内镜像。
