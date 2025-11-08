export type PdfExtractionStage = 'loading' | 'text' | 'image' | 'done';

export interface PdfExtractionProgress {
  stage: PdfExtractionStage;
  currentPage: number;
  totalPages: number;
}

export interface ExtractedPdfImage {
  page: number;
  dataUrl: string;
  width?: number;
  height?: number;
}

export interface ExtractedPdfContent {
  textByPage: string[];
  textContent: string;
  structuredTextHtml: string;
  images: ExtractedPdfImage[];
}

export interface ExtractPdfOptions {
  maxPages?: number;
  scale?: number;
  captureImages?: boolean;
  onProgress?: (progress: PdfExtractionProgress) => void;
  pdfjsLib?: any;
}

const PDF_JS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const XLINK_NS = 'http://www.w3.org/1999/xlink';

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const convertPageTextToHtml = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const paragraphs = sentences
    .reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (!last) {
        acc.push(sentence);
        return acc;
      }

      if (last.length < 180) {
        acc[acc.length - 1] = `${last} ${sentence}`.trim();
        return acc;
      }

      acc.push(sentence);
      return acc;
    }, [])
    .map(sentence => `<p>${escapeHtml(sentence.trim())}</p>`)
    .join('');

  return paragraphs || `<p>${escapeHtml(normalized)}</p>`;
};

const getImageHrefValue = (image: SVGImageElement): string | null => {
  const animatedHref = (image as any).href?.baseVal as string | undefined;
  if (animatedHref) {
    return animatedHref;
  }

  const directHref = image.getAttribute('href');
  if (directHref) {
    return directHref;
  }

  return image.getAttributeNS(XLINK_NS, 'href');
};

const readBlobAsDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao converter blob em data URL.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler dados da imagem do PDF.'));
    reader.readAsDataURL(blob);
  });
};

const convertBlobUrlToDataUrl = async (blobUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const dataUrl = await readBlobAsDataUrl(blob);
    return dataUrl;
  } catch (error) {
    console.warn('Falha ao converter imagem embutida do PDF:', error);
    return null;
  } finally {
    try {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(blobUrl);
      }
    } catch (revokeError) {
      console.warn('Não foi possível liberar URL temporária da imagem:', revokeError);
    }
  }
};

interface EmbeddedImageInfo {
  dataUrl: string;
  width?: number;
  height?: number;
}

const extractEmbeddedImagesFromPage = async (
  pdfjsLib: any,
  page: any,
  scale: number,
): Promise<EmbeddedImageInfo[]> => {
  if (typeof window === 'undefined') {
    return [];
  }

  const SVGGraphics = pdfjsLib?.SVGGraphics;
  if (!SVGGraphics) {
    return [];
  }

  try {
    const viewport = page.getViewport({ scale });
    const svgGraphics = new SVGGraphics(page.commonObjs, page.objs);
    svgGraphics.embedFonts = true;

    const svg = (await svgGraphics.getSVG(viewport)) as SVGElement;
    const imageElements = Array.from(svg.querySelectorAll('image')) as SVGImageElement[];

    if (imageElements.length === 0) {
      if (typeof (svg as any).remove === 'function') {
        (svg as any).remove();
      }
      return [];
    }

    const uniqueImages = new Map<string, EmbeddedImageInfo>();

    for (const imageElement of imageElements) {
      const href = getImageHrefValue(imageElement);
      if (!href) {
        continue;
      }

      let dataUrl: string | null = null;

      if (href.startsWith('data:image/')) {
        dataUrl = href;
      } else if (href.startsWith('blob:')) {
        dataUrl = await convertBlobUrlToDataUrl(href);
      }

      if (!dataUrl) {
        continue;
      }

      if (!uniqueImages.has(dataUrl)) {
        const width = imageElement.width?.baseVal?.value || undefined;
        const height = imageElement.height?.baseVal?.value || undefined;
        uniqueImages.set(dataUrl, { dataUrl, width, height });
      }
    }

    if (typeof (svg as any).remove === 'function') {
      (svg as any).remove();
    }

    return Array.from(uniqueImages.values());
  } catch (error) {
    console.warn('Falha ao extrair imagens embutidas do PDF:', error);
    return [];
  }
};

export const loadPdfJs = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in the browser.');
  }

  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PDF_JS_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).pdfjsLib));
      existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar PDF.js')));
      return;
    }

    const script = document.createElement('script');
    script.src = PDF_JS_SRC;
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      resolve((window as any).pdfjsLib);
    };
    script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
    document.head.appendChild(script);
  });
};

export const extractPdfContent = async (
  file: File,
  options: ExtractPdfOptions = {}
): Promise<ExtractedPdfContent> => {
  const { maxPages, scale = 1.5, captureImages = true, onProgress, pdfjsLib: providedPdfjs } = options;

  const pdfjsLib = providedPdfjs ?? (await loadPdfJs());

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = typeof maxPages === 'number' ? Math.min(maxPages, pdf.numPages) : pdf.numPages;
  const textByPage: string[] = [];
  const images: ExtractedPdfImage[] = [];

  onProgress?.({ stage: 'loading', currentPage: 0, totalPages });

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    onProgress?.({ stage: 'text', currentPage: pageNum, totalPages });

    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item: any) => item.str && item.str.trim().length > 0)
      .map((item: any) => item.str.trim())
      .join(' ')
      .replace(/\s+/g, ' ') // normalizar espaços
      .trim();

    textByPage.push(pageText);

    if (captureImages) {
      onProgress?.({ stage: 'image', currentPage: pageNum, totalPages });
      const embeddedImages = await extractEmbeddedImagesFromPage(pdfjsLib, page, scale);
      embeddedImages.forEach(({ dataUrl, width, height }) => {
        images.push({ page: pageNum, dataUrl, width, height });
      });
    }

    await page.cleanup();
  }

  onProgress?.({ stage: 'done', currentPage: totalPages, totalPages });

  const textContent = textByPage
    .map((pageText, index) => `--- PÁGINA ${index + 1} ---\n${pageText}`)
    .join('\n');

  const structuredTextHtml = textByPage
    .map((pageText, index) => {
      const html = convertPageTextToHtml(pageText);
      if (!html) {
        return '';
      }

      return `
        <section data-pdf-page="${index + 1}" style="margin: 18px 0;">
          <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 18px; font-weight: 700;">Página ${index + 1}</h3>
          ${html}
        </section>
      `;
    })
    .join('');

  return {
    textByPage,
    textContent,
    structuredTextHtml,
    images,
  };
};

export const buildResumoFromPages = (pages: string[], maxLength = 260): string => {
  const combined = pages.join(' ').replace(/\s+/g, ' ').trim();
  if (!combined) {
    return '';
  }

  if (combined.length <= maxLength) {
    return combined;
  }

  const truncated = combined.slice(0, maxLength);
  const lastSentenceBreak = truncated.lastIndexOf('.');
  if (lastSentenceBreak > maxLength * 0.5) {
    return `${truncated.slice(0, lastSentenceBreak + 1).trim()} ...`;
  }

  return `${truncated.trim()} ...`;
};
