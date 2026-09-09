export async function fileToResizedJpeg(
  file: File,
  maxEdge = 1280,
  quality = 0.8,
): Promise<{ base64: string; mime: string; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible de redimensionner l'image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Export JPEG échoué."))),
      "image/jpeg",
      quality,
    );
  });

  const previewUrl = URL.createObjectURL(blob);
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return {
    base64: btoa(binary),
    mime: "image/jpeg",
    previewUrl,
  };
}
