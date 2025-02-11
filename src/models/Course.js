const mongoose = require("mongoose");

const wishSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("Wish", wishSchema);
