import JSZip from "jszip";

const SPREADSHEETML_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const PREFIXED_NAMESPACE_DECLARATION = `xmlns:x="${SPREADSHEETML_NAMESPACE}"`;

/**
 * ExcelJS 4.4 cannot parse SpreadsheetML elements that use an explicit `x:`
 * prefix. Normalise only an in-memory copy of those XML parts; the source XLSX
 * buffer and file are never written to or mutated.
 */
export const normalizeSpreadsheetMlNamespaces = async (buffer: Buffer): Promise<Buffer> => {
  const archive = await JSZip.loadAsync(buffer);
  const entries = Object.values(archive.files).filter(entry => !entry.dir && entry.name.endsWith(".xml"));
  let changed = false;

  await Promise.all(entries.map(async entry => {
    const xml = await entry.async("string");
    if (!xml.includes(PREFIXED_NAMESPACE_DECLARATION)) return;

    changed = true;
    archive.file(entry.name, xml
      .replace(PREFIXED_NAMESPACE_DECLARATION, `xmlns="${SPREADSHEETML_NAMESPACE}"`)
      .replace(/(<\/?)(?:x):/g, "$1"));
  }));

  if (!changed) return buffer;
  return Buffer.from(await archive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};
