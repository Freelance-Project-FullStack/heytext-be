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
  }
};

module.exports = fontController; 