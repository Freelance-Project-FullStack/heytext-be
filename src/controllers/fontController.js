const Font = require("../models/Font");
const { uploadImage } = require("../utils/uploadImage");
const path = require("path");
const mongoose = require("mongoose");

const fontController = {
  // Get all fonts with filters
  getAllFonts: async (req, res) => {
    try {
      const { search, tags, category, sort, isActive } = req.query;
      let query = {};

      // Add filters
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      if (tags) {
        query.tags = { $in: tags.split(",") };
      }
      if (category) {
        query.category = category;
      }
      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      // Enhanced sorting options
      let sortOption = {};
      switch (sort) {
        case "downloads":
          sortOption = { downloads: -1 };
          break;
        case "views":
          sortOption = { views: -1 };
          break;
        case "rating":
          sortOption = { rating: -1 };
          break;
        case "price":
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
        tags,
        fontUrl,
        previewUrl,
      } = req.body;

      // Validate required fields
      if (!name || !description || !category) {
        return res.status(400).json({
          success: false,
          message: "Name, description, and category are required",
        });
      }

      if (
        (!req.files || !req.files.fontFile || !req.files.previewImage) &&
        !fontUrl
      ) {
        return res.status(400).json({
          success: false,
          message: "Both font file and preview image are required",
        });
      }

      // Validate font file type
      const fontFile = req.files?.fontFile[0];
      if (fontFile) {
        const validFontTypes = [".ttf", ".otf", ".woff", ".woff2"];
        const fontExt = fontFile
          ? path.extname(fontFile?.originalname).toLowerCase()
          : "";

        if (fontFile && !validFontTypes.includes(fontExt)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid font file type. Supported types: TTF, OTF, WOFF, WOFF2",
          });
        }
      }

      // Validate preview image type
      const previewFile = req.files?.previewImage[0];
      if (previewFile) {
        const validImageTypes = [".jpg", ".jpeg", ".png", ".gif"];
        const imageExt = path.extname(previewFile?.originalname).toLowerCase();

        if (previewFile && !validImageTypes.includes(imageExt)) {
          return res.status(400).json({
            success: false,
            message: "Invalid image file type. Supported types: JPG, PNG, GIF",
          });
        }
      }
      // Upload files
      const fontUrlUpload = fontUrl ? fontUrl : await uploadImage(fontFile);
      const previewPath = previewUrl
        ? previewUrl
        : previewFile
        ? await uploadImage(previewFile)
        : "";

      const font = await Font.create({
        name,
        description,
        category,
        styles: styles || [],
        uses: uses || [],
        price: Number(price) || 0,
        downloads: 0,
        views: 0,
        rating: "0.0",
        isActive: true,
        fontUrl: fontUrlUpload,
        previewImage: previewPath,
        tags: tags || [],
        createdAt: new Date(),
        createdBy: new mongoose.Types.ObjectId(require.user?._id),
      });

      res.json({ success: true, data: font });
    } catch (error) {
      console.error("Error uploading font:", error);
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
          message: "Font not found",
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
          message: "Font not found",
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
          message: "Font not found",
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
          message: "Font not found",
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
          message: "Invalid rating value",
        });
      }

      const font = await Font.findById(id);
      if (!font) {
        return res.status(404).json({
          success: false,
          message: "Font not found",
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
      const categories = await Font.distinct("category");
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
      const user = req.user || {};
      const {
        search,
        categories,
        styles,
        uses,
        minDownloads,
        maxPrice,
        rating,
        hideDisabled,
      } = req.query;
      // const { subscription } = req.body;

      let searchQuery = { isActive: true };

      // Search by name, description, or tags
      if (search) {
        searchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Filter by categories (array)
      if (categories && Array.isArray(categories)) {
        searchQuery.category = { $in: categories };
      }

      // Filter by styles (array)
      if (styles && Array.isArray(styles)) {
        searchQuery.styles = { $in: styles };
      }

      // Filter by uses (array)
      if (uses && Array.isArray(uses)) {
        searchQuery.uses = { $in: uses };
      }

      // Filter by minimum downloads
      if (minDownloads !== undefined) {
        searchQuery.downloads = { $gte: Number(minDownloads) };
      }

      // Filter by maximum price
      if (maxPrice !== undefined) {
        searchQuery.price = { $lte: Number(maxPrice) };
      }

      // Filter by minimum rating
      if (rating !== undefined) {
        searchQuery.rating = { $gte: Number(rating) };
      }

      // Fetch fonts based on search query
      const fonts = await Font.find(searchQuery).sort({
        rating: -1,
        downloads: -1,
      });

      // Handle premium font access
      const results = fonts.map((font) => {
        const fontObj = font.toObject();
        if (user.subscription != "premium" && font.price > 0) {
          fontObj.disabled = true;
        }
        return fontObj;
      });

      // Filter out disabled fonts if hideDisabled is true
      const finalResults =
        hideDisabled === "true"
          ? results.filter((font) => !font.disabled)
          : results;

      res.json({ success: true, data: finalResults });
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
          message: "Font not found",
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
          message: "Font not found",
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
          message: "Font not found",
        });
      }

      res.json({ success: true, message: "Font deleted successfully" });
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
          message: "Font IDs array is required",
        });
      }

      await Font.deleteMany({ _id: { $in: ids } });

      res.json({
        success: true,
        message: `Successfully deleted ${ids.length} fonts`,
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
          message: "Font IDs array and status are required",
        });
      }

      await Font.updateMany({ _id: { $in: ids } }, { $set: { isActive } });

      res.json({
        success: true,
        message: `Successfully updated status for ${ids.length} fonts`,
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
              $sum: { $cond: ["$isActive", 1, 0] },
            },
            totalDownloads: { $sum: "$downloads" },
            totalViews: { $sum: "$views" },
            averageRating: { $avg: { $toDouble: "$rating" } },
          },
        },
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
            _id: "$category",
            totalDownloads: { $sum: "$downloads" },
            averageDownloads: { $avg: "$downloads" },
            fonts: { $push: { name: "$name", downloads: "$downloads" } },
          },
        },
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
            _id: "$category",
            averageRating: { $avg: { $toDouble: "$rating" } },
            fonts: { $push: { name: "$name", rating: "$rating" } },
          },
        },
      ]);

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = fontController;
