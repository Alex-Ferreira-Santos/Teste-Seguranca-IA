import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, "../storage/uploads"));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const mimeAllowed = allowedMimeTypes.includes(file.mimetype);
    const extAllowed = allowedExtensions.includes(ext);

    if (!mimeAllowed || !extAllowed) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  },
});