import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  created_at: string;
  resource_type?: string;
}

export const STORAGE_FOLDERS = {
  ARTWORK: "campusfund/artworks",
  CUSTOM: "campusfund/custom",
  PROFILE_PICS: "campusfund/profiles",
  BANNERS: "campusfund/banners",
  INVOICES: "campusfund/invoices",
} as const;

// ✅ Common upload handler
const uploadImage = async (
  file: Buffer | string,
  folder: string
): Promise<CloudinaryUploadResult> => {
  try {
    let uploadSource: string;

    if (typeof file === "string") {
      uploadSource = file;
    } else {
      const base64String = file.toString("base64");
      uploadSource = `data:image/jpeg;base64,${base64String}`;
    }

    const result = await cloudinary.uploader.upload(uploadSource, {
      folder,
      format: "webp", // ✅ Force webp conversion
      quality: "auto", // ✅ Compress intelligently
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at,
    };
  } catch (error: any) {
    throw new Error(`Cloudinary upload failed: ${error.message || error}`);
  }
};

const uploadAsset = async (
  file: Buffer | string,
  folder: string,
  resourceType: "image" | "raw" = "image"
): Promise<CloudinaryUploadResult> => {
  try {
    let uploadSource: string;

    if (typeof file === "string") {
      uploadSource = file;
    } else {
      const base64String = file.toString("base64");
      if (resourceType === "raw") {
        uploadSource = `data:application/octet-stream;base64,${base64String}`;
      } else {
        uploadSource = `data:image/jpeg;base64,${base64String}`;
      }
    }

    const result = await cloudinary.uploader.upload(uploadSource, {
      folder,
      resource_type: resourceType,
      ...(resourceType === "image" ? { format: "webp", quality: "auto" } : {}),
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at,
      resource_type: result.resource_type,
    };
  } catch (error: any) {
    throw new Error(`Cloudinary upload failed: ${error.message || error}`);
  }
};

// ✅ Individual uploaders
export const uploadArtworkImage = async (file: Buffer | string) =>
  uploadImage(file, STORAGE_FOLDERS.ARTWORK);

export const uploadCustomImage = async (file: Buffer | string) =>
  uploadImage(file, STORAGE_FOLDERS.CUSTOM);

export const uploadProfileImage = async (file: Buffer | string) =>
  uploadImage(file, STORAGE_FOLDERS.PROFILE_PICS);

export const uploadBannerImage = async (file: Buffer | string) =>
  uploadImage(file, STORAGE_FOLDERS.BANNERS);

export const uploadInvoiceAsset = async (
  file: Buffer | string,
  mimeType: string
) => {
  const isImage = mimeType.startsWith("image/");
  return uploadAsset(file, STORAGE_FOLDERS.INVOICES, isImage ? "image" : "raw");
};

// ✅ Deletion
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    throw new Error(`Cloudinary deletion failed: ${error.message || error}`);
  }
};
