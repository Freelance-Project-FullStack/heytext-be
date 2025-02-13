const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const Font = require("../models/Font");
const fontController = require("../controllers/fontController")
// Create a new Font (Admin only)
router.post(
  "/create",
  [
    body("name").notEmpty().withMessage("Font name is required"),
    body("fontUrl").notEmpty().withMessage("font URL is required"),
    body("type")
      .isIn(["webfont", "desktop", "other"])
      .withMessage("Invalid font type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, fontUrl, type, album, description } = req.body;

      const newFont = new Font({
        name,
        fontUrl,
        type,
        album,
        description,
      });

      const savedFont = await newFont.save();
      res.status(201).json(savedFont);
    } catch (error) {
      res.status(500).json({ message: "Error creating font", error });
    }
  }
);

// Update font (Admin only)
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Font name must not be empty"),
    body("fontUrl")
      .optional()
      .notEmpty()
      .withMessage("font URL must not be empty"),
    body("type")
      .optional()
      .isIn(["webfont", "desktop", "other"])
      .withMessage("Invalid font type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedFont = await Font.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedFont) {
        return res.status(404).json({ message: "Font not found" });
      }

      res.json(updatedFont);
    } catch (error) {
      res.status(500).json({ message: "Error updating font", error });
    }
  }
);

// Delete a font (Admin only)
router.delete("/:id", async (req, res) => {
  try {
    const deletedFont = await Font.findByIdAndDelete(req.params.id);

    if (!deletedFont) {
      return res.status(404).json({ message: "Font not found" });
    }

    res.json({ message: "Font deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting font", error });
  }
});

// Increment download count (When a font is downloaded)
router.post("/increment-downloads/:id", async (req, res) => {
  try {
    const font = await Font.findById(req.params.id);

    if (!font) {
      return res.status(404).json({ message: "Font not found" });
    }

    font.downloadsCount += 1;
    await font.save();

    res.json({
      message: "Download count updated",
      downloadsCount: font.downloadsCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating download count", error });
  }
});

// Increment usage count (When a font is used)
router.post("/increment-usage/:id", async (req, res) => {
  try {
    const font = await Font.findById(req.params.id);

    if (!font) {
      return res.status(404).json({ message: "Font not found" });
    }

    font.usageCount += 1;
    await font.save();

    res.json({ message: "Usage count updated", usageCount: font.usageCount });
  } catch (error) {
    res.status(500).json({ message: "Error updating usage count", error });
  }
});

router.get('/fonts', fontController.getAllFonts);
router.post('/fonts', 
  upload.fields([
    { name: 'fontFile', maxCount: 1 },
    { name: 'previewImage', maxCount: 1 }
  ]),
  fontController.uploadFont
);


module.exports = router;
