// PDF and Document Text Extractor for E-Judge MinerU Pipeline

export interface DocumentExtractResult {
  success: boolean;
  fileName: string;
  pageCount: number;
  fullText: string;
  error?: string;
}

// Polyfill Promise.try if not supported
if (typeof Promise !== 'undefined' && !(Promise as any).try) {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise(resolve => resolve(fn(...args)));
  };
}

export async function extractTextFromPdf(file: File | Blob, fileName: string = 'document.pdf'): Promise<DocumentExtractResult> {
  try {
    // Convert File or Blob to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Dynamically load PDF.js from public/pdfjs at browser runtime
    let pdfjs: any;
    try {
      const dynamicImport = new Function('url', 'return import(url)');
      pdfjs = await dynamicImport('/pdfjs/pdf.min.mjs');
    } catch {
      // Fallback: load via standard script or global
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        pdfjs = (window as any).pdfjsLib;
      } else {
        throw new Error('未能加载PDF解析内核，请稍后重试');
      }
    }

    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    }

    const loadingTask = pdfjs.getDocument({
      data,
      cMapPacked: true
    });

    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items || [];

      // Group text items by vertical position (Y coordinate)
      const lineMap = new Map<number, Array<{ x: number; str: string }>>();

      for (const item of items) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform ? item.transform[5] : 0);

        // Find existing line within 3px tolerance
        let matchedY: number | null = null;
        for (const existingY of lineMap.keys()) {
          if (Math.abs(existingY - y) <= 3) {
            matchedY = existingY;
            break;
          }
        }

        const targetY = matchedY !== null ? matchedY : y;
        if (!lineMap.has(targetY)) {
          lineMap.set(targetY, []);
        }
        lineMap.get(targetY)!.push({
          x: item.transform ? item.transform[4] : 0,
          str: item.str
        });
      }

      // Sort lines from top to bottom (Y descending in PDF coordinate system)
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

      const lines = sortedYs.map(y => {
        const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
        let joined = lineItems.map(i => i.str).join(' ').trim();
        // Collapse spaces between Chinese characters
        joined = joined.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');
        joined = joined.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');
        return joined;
      }).filter(Boolean);

      const pageHeading = `--- 第 ${pageNum} 页 / 共 ${pageCount} 页 ---`;
      pageTexts.push(`${pageHeading}\n${lines.join('\n')}`);
    }

    const fullText = pageTexts.join('\n\n');

    return {
      success: true,
      fileName,
      pageCount,
      fullText
    };
  } catch (err: any) {
    console.warn('PDF.js client extraction failed, using fallback reader:', err);

    // Fallback: try plain text reader if the file contains plain text or doc
    try {
      const text = await file.text();
      // Filter out binary control chars
      const printable = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      if (printable.length > 50) {
        return {
          success: true,
          fileName,
          pageCount: 1,
          fullText: printable
        };
      }
    } catch {}

    return {
      success: false,
      fileName,
      pageCount: 0,
      fullText: '',
      error: err?.message || 'PDF文件解析失败，请检查文件完整性'
    };
  }
}
