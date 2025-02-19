const Font = require('../models/Font');
const { uploadFile } = require('../utils/fileUpload'); // Implement file upload utility
const path = require('path');

const fontController = {
  // Get all fonts with filters
  getAllFonts: async (req, res) => {
    try {
      const { search, tags, category, sort, isActive } = req.query;
      let query = {};
      
      // Add filters
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (tags) {
        query.tags = { $in: tags.split(',') };
      }
      if (category) {
        query.category = category;
      }
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      // Enhanced sorting options
      let sortOption = {};
      switch(sort) {
        case 'downloads':
          sortOption = { downloads: -1 };
          break;
        case 'views':
          sortOption = { views: -1 };
          break;
        case 'rating':
          sortOption = { rating: -1 };
          break;
        case 'price':
          sortOption = { price: 1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }

      const fonts = await Font.find(query).sort(sortOption);
      
      res.json({ success: true, data: fonts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Upload new font
  uploadFont: async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        styles,
        uses,
        price,
        tags
      } = req.body;
      
      // Validate required fields
      if (!name || !description || !category) {
        return res.status(400).json({
          success: false,
          message: 'Name, description, and category are required'
        });
      }

      if (!req.files || !req.files.fontFile || !req.files.previewImage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Both font file and preview image are required' 
        });
      }

      // Validate font file type
      const fontFile = req.files.fontFile[0];
      const validFontTypes = ['.ttf', '.otf', '.woff', '.woff2'];
      const fontExt = path.extname(fontFile.originalname).toLowerCase();
      
      if (!validFontTypes.includes(fontExt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid font file type. Supported types: TTF, OTF, WOFF, WOFF2'
        });
      }

      // Validate preview image type
      const previewFile = req.files.previewImage[0];
      const validImageTypes = ['.jpg', '.jpeg', '.png', '.gif'];
      const imageExt = path.extname(previewFile.originalname).toLowerCase();
      
      if (!validImageTypes.includes(imageExt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image file type. Supported types: JPG, PNG, GIF'
        });
      }

      // Upload files
      const fontUrl = await uploadFile(fontFile);
      const previewPath = await uploadFile(previewFile);

      const font = await Font.create({
        name,
        description,
        category,
        styles: styles ? styles.split(',').map(style => style.trim()) : ['Regular'],
        uses: uses ? uses.split(',').map(use => use.trim()) : [],
        price: Number(price) || 0,
        downloads: 0,
        views: 0,
        rating: "0.0",
        isActive: true,
        fontUrl,
        previewImage: previewPath,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        createdAt: new Date()
      });

      res.json({ success: true, data: font });
    } catch (error) {
      console.error('Error uploading font:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // New method to toggle font active status
  toggleFontStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const font = await Font.findById(id);
      
      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      font.isActive = !font.isActive;
      await font.save();

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get font by ID
  getFontById: async (req, res) => {
    try {
      const { id } = req.params;
      const font = await Font.findById(id);
      
      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      // Increment views counter
      font.views += 1;
      await font.save();

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update font details
  updateFont: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updateData.downloads;
      delete updateData.views;
      delete updateData.rating;
      delete updateData.createdAt;

      const font = await Font.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Increment download count
  incrementDownload: async (req, res) => {
    try {
      const { id } = req.params;
      const font = await Font.findByIdAndUpdate(
        id,
        { $inc: { downloads: 1 } },
        { new: true }
      );

      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update font rating
  updateRating: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 0 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rating value'
        });
      }

      const font = await Font.findById(id);
      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      font.rating = rating.toFixed(1);
      await font.save();

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get font categories
  getCategories: async (req, res) => {
    try {
      const categories = await Font.distinct('category');
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get popular fonts
  getPopularFonts: async (req, res) => {
    try {
      const fonts = await Font.find({ isActive: true })
        .sort({ downloads: -1, views: -1 })
        .limit(10);
      res.json({ success: true, data: fonts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get recent fonts
  getRecentFonts: async (req, res) => {
    try {
      const fonts = await Font.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(10);
      res.json({ success: true, data: fonts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Search fonts
  searchFonts: async (req, res) => {
    try {
      const { query, category, tags, priceMin, priceMax } = req.query;
      let searchQuery = { isActive: true };

      if (query) {
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ];
      }

      if (category) {
        searchQuery.category = category;
      }

      if (tags) {
        searchQuery.tags = { $in: tags.split(',') };
      }

      if (priceMin !== undefined || priceMax !== undefined) {
        searchQuery.price = {};
        if (priceMin !== undefined) searchQuery.price.$gte = Number(priceMin);
        if (priceMax !== undefined) searchQuery.price.$lte = Number(priceMax);
      }

      const fonts = await Font.find(searchQuery)
        .sort({ rating: -1, downloads: -1 });

      res.json({ success: true, data: fonts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Download font file
  downloadFont: async (req, res) => {
    try {
      const { id } = req.params;
      const font = await Font.findById(id);

      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      // Increment download count
      font.downloads += 1;
      await font.save();

      // Send file
      res.download(font.fontUrl);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Increment views
  incrementViews: async (req, res) => {
    try {
      const { id } = req.params;
      const font = await Font.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      );

      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete font
  deleteFont: async (req, res) => {
    try {
      const { id } = req.params;
      const font = await Font.findByIdAndDelete(id);

      if (!font) {
        return res.status(404).json({
          success: false,
          message: 'Font not found'
        });
      }

      res.json({ success: true, message: 'Font deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Batch delete fonts
  batchDeleteFonts: async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          message: 'Font IDs array is required'
        });
      }

      await Font.deleteMany({ _id: { $in: ids } });

      res.json({ 
        success: true, 
        message: `Successfully deleted ${ids.length} fonts` 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Batch update status
  batchUpdateStatus: async (req, res) => {
    try {
      const { ids, isActive } = req.body;

      if (!ids || !Array.isArray(ids) || isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Font IDs array and status are required'
        });
      }

      await Font.updateMany(
        { _id: { $in: ids } },
        { $set: { isActive } }
      );

      res.json({ 
        success: true, 
        message: `Successfully updated status for ${ids.length} fonts` 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get font statistics overview
  getFontStats: async (req, res) => {
    try {
      const stats = await Font.aggregate([
        {
          $group: {
            _id: null,
            totalFonts: { $sum: 1 },
            activeFonts: { 
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            totalDownloads: { $sum: '$downloads' },
            totalViews: { $sum: '$views' },
            averageRating: { $avg: { $toDouble: '$rating' } }
          }
        }
      ]);

      res.json({ success: true, data: stats[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get download statistics
  getDownloadStats: async (req, res) => {
    try {
      const stats = await Font.aggregate([
        {
          $group: {
            _id: '$category',
            totalDownloads: { $sum: '$downloads' },
            averageDownloads: { $avg: '$downloads' },
            fonts: { $push: { name: '$name', downloads: '$downloads' } }
          }
        }
      ]);

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get rating statistics
  getRatingStats: async (req, res) => {
    try {
      const stats = await Font.aggregate([
        {
          $group: {
            _id: '$category',
            averageRating: { $avg: { $toDouble: '$rating' } },
            fonts: { $push: { name: '$name', rating: '$rating' } }
          }
        }
      ]);

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = fontController; 