import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

const MIME_MAP: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
};

function ext(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

async function parsePdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean);
    pages.push(strings.join(" "));
  }
  return pages.join("\n\n");
}

async function parseDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function parseXlsx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const text = XLSX.utils.sheet_to_csv(sheet);
    if (text.trim()) sheets.push(`--- ${name} ---\n${text}`);
  }
  return sheets.join("\n\n");
}

export async function parseFile(file: File): Promise<{ text: string; mimeType: string }> {
  const extension = ext(file.name);
  const mimeType = MIME_MAP[extension] ?? "text/plain";

  let text: string;

  switch (extension) {
    case "pdf":
      text = await parsePdf(file);
      break;
    case "docx":
      text = await parseDocx(file);
      break;
    case "xlsx":
    case "xls":
      text = await parseXlsx(file);
      break;
    default:
      text = await file.text();
      break;
  }

  return { text, mimeType };
}

export const ACCEPTED_EXTENSIONS =
  ".txt,.md,.csv,.json,.pdf,.docx,.xlsx,.xls";

export const MAX_FILE_SIZE = 10_000_000; // 10 MB
