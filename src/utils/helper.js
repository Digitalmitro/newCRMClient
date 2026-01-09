const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

export const getFileNameFromUrl = (url) => {
  if (!url) return "file";
  try {
    const parsed = new URL(url);
    const nameParam = parsed.searchParams.get("filename") || parsed.searchParams.get("name");
    if (nameParam) return safeDecode(nameParam);
    const name = parsed.pathname.split("/").pop();
    return safeDecode(name || "file");
  } catch (error) {
    const [pathPart, queryPart] = url.split("?");
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const nameParam = params.get("filename") || params.get("name");
      if (nameParam) return safeDecode(nameParam);
    }
    const name = pathPart.split("/").pop() || "file";
    return safeDecode(name);
  }
};

const getDownloadUrl = (url) => {
  if (!url) return url;
  if (url.includes("cloudinary")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}fl_attachment`;
  }
  return url;
};

export const downloadFile = async (url, fallbackName) => {
  try {
    const downloadUrl = getDownloadUrl(url);
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Download failed");
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const headerName = match?.[1];
    const fileName = headerName || fallbackName || getFileNameFromUrl(url);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("File download failed:", error);
    const fallbackUrl = getDownloadUrl(url);
    if (fallbackUrl) {
      window.open(fallbackUrl, "_blank", "noopener");
    }
  }
};

export const downloadImage = async (url) => downloadFile(url);
