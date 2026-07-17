const fs = require("node:fs");
const path = require("node:path");
const ExifReader = require("../assets/vendor/exifreader/exif-reader.js");

const projectRoot = path.resolve(__dirname, "..");
const imageNames = fs.readdirSync(projectRoot)
  .filter((name) => /\.jpe?g$/i.test(name))
  .sort((left, right) => left.localeCompare(right, "zh-CN"));

function unwrap(tag) {
  if (tag === undefined || tag === null) return null;
  if (typeof tag !== "object" || Array.isArray(tag)) return tag;
  if (tag.computed !== undefined) return tag.computed;
  if (tag.value !== undefined) return tag.value;
  return tag.description ?? null;
}

function find(tags, names) {
  const groups = ["exif", "iptc", "xmp", "file", "composite", "makerNotes"];
  for (const name of names) {
    for (const group of groups) {
      if (tags[group] && Object.hasOwn(tags[group], name)) return unwrap(tags[group][name]);
    }
  }
  return null;
}

for (const name of imageNames) {
  const filePath = path.join(projectRoot, name);
  try {
    const tags = ExifReader.load(fs.readFileSync(filePath), { expanded: true, computed: true });
    const result = {
      file: name,
      groups: Object.keys(tags),
      exifTags: tags.exif ? Object.keys(tags.exif).length : 0,
      make: find(tags, ["Make"]),
      model: find(tags, ["Model"]),
      lens: find(tags, ["LensModel", "Lens"]),
      date: find(tags, ["DateTimeOriginal", "DateTimeDigitized", "DateTime"]),
      orientation: find(tags, ["Orientation"]),
      width: find(tags, ["PixelXDimension", "ImageWidth", "Image Width"]),
      height: find(tags, ["PixelYDimension", "ImageHeight", "Image Height"]),
      latitude: tags.gps?.Latitude ?? null,
      longitude: tags.gps?.Longitude ?? null,
      altitude: tags.gps?.Altitude ?? null,
    };
    console.log(JSON.stringify(result));
  } catch (error) {
    console.log(JSON.stringify({ file: name, error: error.message }));
  }
}
