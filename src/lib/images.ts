export type ResizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
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
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.82;

  const originalDataUrl = await fileToDataUrl(file);
  const image = await loadImage(originalDataUrl);

  const originalWidth = image.width;
  const originalHeight = image.height;

  let outputWidth = originalWidth;
  let outputHeight = originalHeight;

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

  const prefersPng = file.type === "image/png" || file.type === "image/gif";
  const outputType = prefersPng ? "image/png" : "image/jpeg";

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    return {
      dataUrl: originalDataUrl,
      width: originalWidth,
      height: originalHeight,
      mimeType: file.type || "image/png",
      size: file.size
    };
  }

  context.drawImage(image, 0, 0, outputWidth, outputHeight);

  const dataUrl = canvas.toDataURL(
    outputType,
    outputType === "image/jpeg" ? quality : undefined
  );

  return {
    dataUrl,
    width: outputWidth,
    height: outputHeight,
    mimeType: outputType,
    size: estimateDataUrlSize(dataUrl)
  };
}
