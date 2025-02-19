const express = require("express");
const router = express.Router();
const fontController = require("../controllers/fontController");
const { upload } = require("../middlewares/uploadMiddleware");

// Public routes
router.get("/", fontController.getAllFonts);
router.get("/categories", fontController.getCategories);
router.get("/popular", fontController.getPopularFonts);
router.get("/recent", fontController.getRecentFonts);
router.get("/search", fontController.searchFonts);
router.get("/:id", fontController.getFontById);

// Download related
router.get("/:id/download", fontController.downloadFont);
router.post("/:id/download-count", fontController.incrementDownload);

// Rating and views
router.post("/:id/rating", fontController.updateRating);
router.post("/:id/view", fontController.incrementViews);

// Admin routes (should be protected)
router.post("", upload.single("fontFile"), fontController.uploadFont);
router.put("/:id", upload.single("fontFile"), fontController.updateFont);
router.delete("/:id", fontController.deleteFont);
router.patch("/:id/toggle-status", fontController.toggleFontStatus);

// Batch operations
router.post("/batch-delete", fontController.batchDeleteFonts);
router.patch("/batch-status", fontController.batchUpdateStatus);

// Statistics
router.get("/stats/overview", fontController.getFontStats);
router.get("/stats/downloads", fontController.getDownloadStats);
router.get("/stats/ratings", fontController.getRatingStats);

module.exports = router;
