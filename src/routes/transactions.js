const express = require("express");
const Transaction = require("../models/Transaction");

function generateTransactionCode(length = 10) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const router = express.Router();

// 1. Lấy danh sách giao dịch
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Tạo giao dịch mới
router.post("/", async (req, res) => {
  const { nguoiDung, goiDangKy, soTien } = req.body;
  const transactionCode = generateTransactionCode();
  const newTransaction = new Transaction({
    maGiaoDich: transactionCode,
    nguoiDung,
    goiDangKy,
    soTien,
    trangThai: "pending",
  });

  try {
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Cập nhật trạng thái giao dịch
router.put("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Giao dịch không tồn tại" });

    transaction.trangThai = req.body.trangThai || transaction.trangThai;
    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
