const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  maGiaoDich: { type: String, required: true, unique: true },
  nguoiDung: { type: String, required: true },
  goiDangKy: { type: String, required: true },
  soTien: { type: Number, required: true },
  ngayTao: { type: Date, default: Date.now },
  trangThai: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
