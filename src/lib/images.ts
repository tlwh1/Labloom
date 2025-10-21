export type ResizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
  minQuality?: number;
  minWidth?: number;
};

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = dataUrl;
  });
}

export function estimateDataUrlSize(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return 0;
  const base64 = dataUrl.slice(commaIndex + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.ceil((base64.length * 3) / 4) - padding;
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function resizeImageFile(
  file: File,
  options: ResizeImageOptions = {}
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  size: number;
}> {
  const maxWidth = options.maxWidth ?? 1200;
  const maxHeight = options.maxHeight ?? 1200;
  const minQuality = options.minQuality ?? 0.5;
  const targetBytes = options.maxBytes ?? 1.5 * 1024 * 1024;
  const minWidth = options.minWidth ?? Math.min(640, maxWidth);
  const dimensionStep = 0.85;

  const originalDataUrl = await fileToDataUrl(file);
  const image = await loadImage(originalDataUrl);

  const originalWidth = image.width;
  const originalHeight = image.height;

  let outputWidth = originalWidth;
  let outputHeight = originalHeight;

  const initialRatio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);
  outputWidth = Math.floor(originalWidth * initialRatio);
  outputHeight = Math.floor(originalHeight * initialRatio);

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    outputWidth = Math.floor(originalWidth * ratio);
    outputHeight = Math.floor(originalHeight * ratio);
  }

  const keepOriginal =
    outputWidth === originalWidth && outputHeight === originalHeight;

  if (keepOriginal) {
    return {
      dataUrl: originalDataUrl,
      width: originalWidth,
      height: originalHeight,
      mimeType: file.type || "image/png",
      size: file.size
    };
  }

  const hasTransparency = (image: HTMLImageElement) => {
    const sampleSize = 64;
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleSize;
    sampleCanvas.height = sampleSize;
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) return false;
    sampleCtx.drawImage(image, 0, 0, sampleSize, sampleSize);
    const data = sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
    return false;
  };

  const transparent = hasTransparency(image);
  let outputType = transparent ? "image/png" : "image/jpeg";
  let quality = Math.min(Math.max(options.quality ?? 0.78, minQuality), 0.92);
  let dataUrl = originalDataUrl;
  let estimatedSize = file.size;
  let currentWidth = Math.max(outputWidth, minWidth);
  let currentHeight = Math.max(outputHeight, Math.floor((originalHeight / originalWidth) * currentWidth));

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      break;
    }

    context.drawImage(image, 0, 0, currentWidth, currentHeight);

    dataUrl = canvas.toDataURL(
      outputType,
      outputType === "image/jpeg" ? quality : undefined
    );
    estimatedSize = estimateDataUrlSize(dataUrl);

    if (estimatedSize <= targetBytes) {
      break;
    }

    if (outputType === "image/jpeg" && quality > minQuality + 0.05) {
      quality = Math.max(minQuality, quality - 0.1);
      continue;
    }

    if (currentWidth > minWidth) {
      currentWidth = Math.max(minWidth, Math.floor(currentWidth * dimensionStep));
      currentHeight = Math.max(
        Math.floor((originalHeight / originalWidth) * currentWidth),
        Math.floor(minWidth * (originalHeight / originalWidth))
      );
      continue;
    }

    if (outputType !== "image/jpeg" && !transparent) {
      outputType = "image/jpeg";
      quality = Math.min(Math.max(options.quality ?? 0.78, minQuality), 0.92);
      continue;
    }

    break;
  }

  return {
    dataUrl,
    width: currentWidth,
    height: currentHeight,
    mimeType: outputType,
    size: estimatedSize
  };
}
