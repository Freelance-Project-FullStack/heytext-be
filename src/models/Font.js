const mongoose = require("mongoose");

const fontSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    styles: {
      type: [String],
      default: ["Regular"],
    },
    uses: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    rating: {
      type: String,
      default: "0.0",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fontUrl: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

// Add index for better search performance
fontSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model("Font", fontSchema);
