import path from "node:path";
import { access, readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import type { CellValue } from "exceljs";
import type { ExcelCellValue, ExcelRowData, ExpertMixWorkbookData } from "./types";

const cellValue = (value: CellValue): ExcelCellValue => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if ("result" in value) return cellValue(value.result as CellValue);
  if ("text" in value && typeof value.text === "string") return value.text;
  if ("hyperlink" in value && typeof value.hyperlink === "string") return typeof value.text === "string" ? value.text : value.hyperlink;
  if ("error" in value) return String(value.error);
  return String(value);
};
const isError = (value: CellValue): boolean => Boolean(value && typeof value === "object" && "error" in value);
const isFormula = (value: CellValue): boolean => Boolean(value && typeof value === "object" && "formula" in value);

export const readExpertMixWorkbookBuffer = async (buffer: Buffer, workbookPath = "<memory>/synthetic.xlsx"): Promise<ExpertMixWorkbookData> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const sheets = workbook.worksheets.map(worksheet => {
    const rows: ExcelRowData[] = [];
    let formulaCellCount = 0; let errorCellCount = 0;
    const maxColumns = Math.max(worksheet.columnCount, 1);
    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const values = Array.from({ length: maxColumns }, (_, index) => {
        const value = row.getCell(index + 1).value;
        if (isFormula(value)) formulaCellCount += 1;
        if (isError(value)) errorCellCount += 1;
        return cellValue(value);
      });
      rows.push({ rowNumber, values, isEmpty: values.every(value => value === null || value === "") });
    }
    return { name: worksheet.name, state: worksheet.state ?? "visible", rows, mergedRanges: [...(worksheet.model.merges ?? [])].sort(), formulaCellCount, errorCellCount };
  });
  return { workbookPath, workbookName: path.basename(workbookPath), sheets };
};

export const readExpertMixWorkbook = async (workbookPath: string): Promise<ExpertMixWorkbookData> => {
  await access(workbookPath);
  return readExpertMixWorkbookBuffer(await readFile(workbookPath), workbookPath);
};
