const Font = require('../models/Font');
const { uploadFile } = require('../utils/fileUpload'); // Implement file upload utility
const path = require('path');

const fontController = {
  // Get all fonts with filters
  getAllFonts: async (req, res) => {
    try {
      const { search, tags, sort } = req.query;
      let query = { isActive: true };
      
      if(search) {
        query.name = { $regex: search, $options: 'i' };
      }
      if(tags) {
        query.tags = { $in: tags.split(',') };
      }

      const fonts = await Font.find(query)
        .sort(sort === 'downloads' ? '-downloads' : '-createdAt');
      
      res.json({ success: true, data: fonts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Upload new font
  uploadFont: async (req, res) => {
    try {
      const { name, price, tags } = req.body;
      
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
      const fontPath = await uploadFile(fontFile);
      const previewPath = await uploadFile(previewFile);

      const font = await Font.create({
        name,
        filePath: fontPath,
        previewImage: previewPath,
        price: Number(price),
        tags: tags.split(',').map(tag => tag.trim()),
        downloads: 0,
        isActive: true
      });

      res.json({ success: true, data: font });
    } catch (error) {
      console.error('Error uploading font:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = fontController; 