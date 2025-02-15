const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: false },
    auth: { type: String, required: false },
    content: { type: String, required: false },
    courseUrl: { type: String, required: false }
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("Course", courseSchema);
