import type { Request } from 'express';
import type { FileFilterCallback } from 'multer';

const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Multer configuration for the single image-upload endpoint. It only receives and screens
// the file; the actual storage happens in controllers/upload.controller.js, which streams
// the buffer to Cloudinary.

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB — generous for hero and product photos

// Keeps the uploaded file in memory as `req.file.buffer` instead of writing it to disk.
// Nothing needs the file on disk because it is forwarded straight to Cloudinary, and the
// server disk on Render is ephemeral — anything written there disappears on the next deploy
// or restart, which is precisely why local disk storage was abandoned.
const storage = multer.memoryStorage();

// Builds the upload middleware used as `upload.single('image')` on the route. The size cap
// rejects oversized files before they are fully buffered into memory, and the MIME filter
// limits uploads to the three image formats the site renders. Both checks run on the server
// because the `accept` attribute on the client input is only a hint and is trivial to
// bypass. A rejected type becomes a 422 ApiError so the failure arrives in the same envelope
// as every other error rather than as a raw multer exception.
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(422, 'INVALID_FILE_TYPE', 'Chỉ chấp nhận jpeg/png/webp'));
    }
    cb(null, true);
  },
});

module.exports = upload;
