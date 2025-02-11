const express = require("express");
const router = express.Router();
const multer = require("multer");
const Font = require("../models/Font");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Set up local storage for uploaded images
const uploadDir = path.join(__dirname, "../uploads"); // Set your uploads directory
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Create the upload directory if it doesn't exist
}

// Set up multer to store files locally
const upload = multer({
  dest: uploadDir, // Save files to the 'uploads' directory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only jpg, jpeg, png, and svg are allowed."
        ),
        false
      );
    }
  },
});

// Route to get all fonts with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Font.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const fonts = await Font.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("_id imageUrl");

    res.json({
      fonts: fonts.map((font) => ({
        _id: font._id,
        imageUrl: font.imageUrl,
      })),
      total,
      page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to delete multiple fonts
router.delete("/", async (req, res) => {
  try {
    const { fontIds } = req.body;

    if (!Array.isArray(fontIds)) {
      return res.status(400).json({ error: "fontIds phải là một mảng" });
    }

    const fonts = await Font.find({ _id: { $in: fontIds } });

    // Delete files locally
    for (const font of fonts) {
      const filePath = path.join(uploadDir, font.imageUrl.split("/").pop());
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Delete the file from local storage
        }
      } catch (error) {
        console.error("Error deleting file from server:", error);
      }
    }

    // Delete records from database
    await Font.deleteMany({ _id: { $in: fontIds } });

    res.json({ message: "Xóa ảnh thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to upload a new font
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Compress the image with sharp
    const compressedImageBuffer = await sharp(req.file.path)
      .rotate() // Auto-rotate based on EXIF data
      .resize(1920, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    // Create a new filename for the compressed image
    const newFileName = `${Date.now()}-${req.file.originalname.replace(
      /\.[^/.]+$/,
      ""
    )}.jpg`;
    const newFilePath = path.join(uploadDir, newFileName);

    // Save the compressed image locally
    await fs.promises.writeFile(newFilePath, compressedImageBuffer);

    // Save image path in the database
    const imageUrl = `/uploads/${newFileName}`;
    const font = new Font({
      imageUrl,
      album: req.body.albumId, // Add albumId if necessary
    });
    const newFont = await font.save();

    res.status(201).json(newFont);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
