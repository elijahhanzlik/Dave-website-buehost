/**
 * Upload an image file via the existing /api/upload signed-URL flow.
 * Falls back to a data URL if Supabase Storage isn't available, mirroring
 * the behavior of components/ImageUploader.tsx.
 */
export async function uploadImage(file: File): Promise<string> {
  const fileToDataUrl = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    if (!res.ok) return await fileToDataUrl(file);

    const { signedUrl, publicUrl } = await res.json();

    const put = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!put.ok) return await fileToDataUrl(file);
    return publicUrl as string;
  } catch {
    return fileToDataUrl(file);
  }
}
