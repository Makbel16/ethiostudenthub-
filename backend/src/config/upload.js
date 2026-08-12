import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "[upload] No Cloudinary credentials found in .env — falling back to local disk storage " +
      "under /uploads. This is fine for local development, but files won't survive a container " +
      "rebuild. Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in backend/.env for persistent storage."
  );
}

// Keep the file in memory, then either stream it to Cloudinary or write it to
// local disk. Basic type/size validation here; consider adding virus scanning
// (e.g. ClamAV) before going to production with untrusted uploads.
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "image/png",
  "image/jpeg",
  "video/mp4",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!hasCloudinaryConfig && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

const uploadToLocalDisk = (buffer, originalname) => {
  const ext = path.extname(originalname) || "";
  const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  const base = process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  return { secure_url: `${base}/uploads/${filename}` };
};

const uploadToCloudinaryImpl = (buffer, folder = "ethiostudenthub") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// Single entry point used by routes — picks Cloudinary or local disk automatically
export const uploadToCloudinary = (buffer, folder = "ethiostudenthub", originalname = "file") =>
  hasCloudinaryConfig ? uploadToCloudinaryImpl(buffer, folder) : Promise.resolve(uploadToLocalDisk(buffer, originalname));

export const localUploadDir = LOCAL_UPLOAD_DIR;
export default cloudinary;