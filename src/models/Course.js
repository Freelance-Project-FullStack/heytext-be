const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    id: {
      type: Number
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false, // Image is optional, set this to true if required
    },
    auth: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    courseUrl: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("Course", courseSchema);
