import axios from "axios";
import { commonApi } from "./client.js";

// Ask common-service for a presigned S3 URL, then PUT the file straight to S3. Returns the storage key.
export const uploadImage = async (file) => {
  const { uploadUrl, key } = await commonApi.post("/uploads/url", { fileName: file.name });
  try {
    // plain axios on purpose: the presigned URL must not get our own headers or interceptors
    await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
  } catch {
    throw new Error("Could not upload the image to storage");
  }
  return key;
};

// The bucket is private, so a stored key is shown through a temporary link. Cached per key.
const viewUrls = new Map();
export const getViewUrl = (key) => {
  if (!viewUrls.has(key)) {
    const promise = commonApi
      .get("/uploads/view-url", { params: { key } })
      .then((data) => data.viewUrl)
      .catch((err) => {
        viewUrls.delete(key);
        throw err;
      });
    viewUrls.set(key, promise);
  }
  return viewUrls.get(key);
};

export const deleteImage = async (key) => {
  if (!key) return;
  try {
    return await commonApi.delete("/uploads/upload", { params: { key: key.split("/")[1] } });
  } catch {
    throw new Error("Failed to delete previous image");
  }
};

// Attachments: images plus documents. Same flow as uploadImage (presigned PUT straight to S3),
// but the server also says which Content-Type the link was signed for.
export const ATTACHMENT_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip"];
export const MAX_ATTACHMENT_MB = 10;

export const uploadAttachment = async (file) => {
  const { uploadUrl, key, contentType } = await commonApi.post("/uploads/attachment-url", { fileName: file.name });
  try {
    await axios.put(uploadUrl, file, { headers: { "Content-Type": contentType } });
  } catch {
    throw new Error(`Could not upload "${file.name}" to storage`);
  }
  return { key, name: file.name, size: file.size, contentType };
};

// Best effort: used to tidy up S3 after an attachment is removed
export const deleteStoredFile = (key) => commonApi.delete("/uploads/upload", { params: { key } }).catch(() => {});
