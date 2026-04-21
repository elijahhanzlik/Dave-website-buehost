type UploadResult = { success: 1; file: { url: string } } | { success: 0 };

export async function uploadByFile(file: File): Promise<UploadResult> {
  try {
    const signRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!signRes.ok) return { success: 0 };

    const { signedUrl, publicUrl } = (await signRes.json()) as {
      signedUrl: string;
      publicUrl: string;
    };

    const putRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) return { success: 0 };

    return { success: 1, file: { url: publicUrl } };
  } catch {
    return { success: 0 };
  }
}

export const imageToolUploader = { uploadByFile };
