function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `lisan-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportTxt(text: string) {
  download(new Blob([text], { type: "text/plain;charset=utf-8" }), `${stamp()}.txt`);
}

export function exportDoc(text: string) {
  const body = escapeHtml(text)
    .split(/\n+/)
    .map((p) => `<p>${p || "&nbsp;"}</p>`)
    .join("");
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Lisan</title></head><body>${body}</body></html>`;
  download(new Blob(["\ufeff", html], { type: "application/msword" }), `${stamp()}.doc`);
}

export async function exportPdf(text: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines: string[] = doc.splitTextToSize(text || " ", 170);
  let y = 20;
  for (const line of lines) {
    if (y > 277) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 6;
  }
  doc.save(`${stamp()}.pdf`);
}
