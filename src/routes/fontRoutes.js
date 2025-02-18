const express = require('express');
const router = express.Router();
const fontController = require('../controllers/fontController');
const { upload } = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/fonts', fontController.getAllFonts);
router.get('/fonts/categories', fontController.getCategories);
router.get('/fonts/popular', fontController.getPopularFonts);
router.get('/fonts/recent', fontController.getRecentFonts);
router.get('/fonts/search', fontController.searchFonts);
router.get('/fonts/:id', fontController.getFontById);

// Download related
router.get('/fonts/:id/download', fontController.downloadFont);
router.post('/fonts/:id/download-count', fontController.incrementDownload);

// Rating and views
router.post('/fonts/:id/rating', fontController.updateRating);
router.post('/fonts/:id/view', fontController.incrementViews);

// Admin routes (should be protected)
router.post('/fonts', upload.single('fontFile'), fontController.uploadFont);
router.put('/fonts/:id', upload.single('fontFile'), fontController.updateFont);
router.delete('/fonts/:id', fontController.deleteFont);
router.patch('/fonts/:id/toggle-status', fontController.toggleFontStatus);

// Batch operations
router.post('/fonts/batch-delete', fontController.batchDeleteFonts);
router.patch('/fonts/batch-status', fontController.batchUpdateStatus);

// Statistics
router.get('/fonts/stats/overview', fontController.getFontStats);
router.get('/fonts/stats/downloads', fontController.getDownloadStats);
router.get('/fonts/stats/ratings', fontController.getRatingStats);

module.exports = router; 