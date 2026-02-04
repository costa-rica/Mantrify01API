import { Router, Request, Response, NextFunction } from "express";
import { SoundFiles } from "mantrify01db";
import { authMiddleware } from "../modules/authMiddleware";
import { AppError, ErrorCodes } from "../modules/errorHandler";
import logger from "../modules/logger";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  sanitizeFilename,
  isMP3File,
  getFilenameWithoutExtension,
} from "../modules/fileUpload";

const router = Router();

// Configure multer for memory storage (we'll validate before saving to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /sounds/sound_files
router.get(
  "/sound_files",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Query all sound files from the database
      const soundFiles = await SoundFiles.findAll({
        attributes: ["id", "name", "description", "filename"],
      });

      logger.info(
        `Sound files retrieved for user ${req.user?.userId}: ${soundFiles.length} files`
      );

      res.status(200).json({
        soundFiles,
      });
    } catch (error: any) {
      logger.error(`Failed to retrieve sound files: ${error.message}`);
      next(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to retrieve sound files",
          500,
          error.message
        )
      );
    }
  }
);

// POST /sounds/upload
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          "No file uploaded",
          400
        );
      }

      // Validate file is MP3
      if (!isMP3File(req.file.originalname)) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          "Only .mp3 files are allowed",
          400
        );
      }

      // Sanitize filename
      const sanitizedFilename = sanitizeFilename(req.file.originalname);

      // Get name and description from request body
      const { name, description } = req.body;

      // Use filename without extension as name if not provided
      const soundName = name || getFilenameWithoutExtension(sanitizedFilename);

      // Check if filename already exists in database
      const existingDbEntry = await SoundFiles.findOne({
        where: { filename: sanitizedFilename },
      });

      if (existingDbEntry) {
        logger.warn(
          `Upload attempt failed: filename ${sanitizedFilename} already exists in database`
        );
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          `A sound file with the name "${sanitizedFilename}" already exists`,
          409
        );
      }

      // Get output path from environment
      const outputPath = process.env.PATH_MP3_SOUND_FILES;
      if (!outputPath) {
        throw new AppError(
          ErrorCodes.INTERNAL_ERROR,
          "Sound files path not configured",
          500
        );
      }

      // Check if file already exists on filesystem
      const filePath = path.join(outputPath, sanitizedFilename);
      if (fs.existsSync(filePath)) {
        logger.warn(
          `Upload attempt failed: file ${sanitizedFilename} already exists on filesystem`
        );
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          `A file with the name "${sanitizedFilename}" already exists on the server`,
          409
        );
      }

      // Save file to disk
      try {
        fs.writeFileSync(filePath, req.file.buffer);
        logger.info(
          `Sound file saved to disk: ${filePath} (${req.file.size} bytes)`
        );
      } catch (error: any) {
        logger.error(`Failed to save file to disk: ${error.message}`);
        throw new AppError(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to save file to server",
          500,
          error.message
        );
      }

      // Create database entry
      try {
        const soundFile = await SoundFiles.create({
          name: soundName,
          description: description || null,
          filename: sanitizedFilename,
        });

        logger.info(
          `Sound file uploaded successfully by user ${req.user?.userId}: ${sanitizedFilename} (ID: ${soundFile.id})`
        );

        res.status(201).json({
          message: "Sound file uploaded successfully",
          soundFile: {
            id: soundFile.id,
            name: soundFile.name,
            description: soundFile.description,
            filename: soundFile.filename,
          },
        });
      } catch (error: any) {
        // If database insert fails, delete the file we just saved
        try {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up file after database error: ${filePath}`);
        } catch (cleanupError: any) {
          logger.error(
            `Failed to cleanup file after database error: ${cleanupError.message}`
          );
        }

        logger.error(`Failed to create database entry: ${error.message}`);
        throw new AppError(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to save sound file information",
          500,
          error.message
        );
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error(`Upload failed: ${error.message}`);
        next(
          new AppError(
            ErrorCodes.INTERNAL_ERROR,
            "Failed to upload sound file",
            500,
            error.message
          )
        );
      }
    }
  }
);

export default router;
