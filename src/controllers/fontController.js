const Font = require('../../models/Font');
const { uploadFile } = require('../utils/fileUpload'); // Implement file upload utility

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
      
      // Upload files
      const fontPath = await uploadFile(req.files.fontFile[0]);
      const previewPath = await uploadFile(req.files.previewImage[0]);

      const font = await Font.create({
        name,
        filePath: fontPath,
        previewImage: previewPath,
        price: Number(price),
        tags: tags.split(',')
      });

      res.json({ success: true, data: font });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = fontController; 