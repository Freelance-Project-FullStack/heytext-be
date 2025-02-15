const mongoose = require("mongoose");

const fontSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensuring unique names for fonts
    },
    fontUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["webfont", "desktop", "other"], // Could be extended based on your needs
      required: true,
    },
    tags: [String],
    description: {
      type: String,
      required: false, // Optional description for the font
    },
    downloadsCount: {
      type: Number,
      default: 0, // Tracks how many times the font has been downloaded
    },
    usageCount: {
      type: Number,
      default: 0, // Tracks how many times the font has been used
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Automatically updated when the font is modified
    },
    isActive: {
      type: Boolean,
      default: true, // To activate or deactivate a font (Admin can manage this)
    },
  },
  {
    timestamps: true, // Ensures automatic tracking of creation and update times
    versionKey: "__v",
  }
);

// Create a method to update the updatedAt field whenever a font is updated
fontSchema.pre("save", function (next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model("Font", fontSchema);
