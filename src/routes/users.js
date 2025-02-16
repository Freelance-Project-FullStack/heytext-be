const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/authController");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, loginMethod, googleId, googleEmail } =
      req.body;

    // Kiểm tra nếu tài khoản đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Hash mật khẩu nếu đăng ký bằng manual
    let hashedPassword = undefined;
    if (loginMethod === "manual") {
      if (!password)
        return res
          .status(400)
          .json({ message: "Password is required for manual login" });
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = new User({
      name,
      email,
      loginMethod,
      password: hashedPassword,
      googleId,
      googleEmail,
    });

    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.loginMethod !== "manual") {
      return res
        .status(400)
        .json({ message: "Use Google login for this account" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", authMiddleware, userController.getCurrentUser);
router.get("/profile", authMiddleware, userController.getCurrentUser);

router.get("/", async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      status: "success",
      message: "Data retrieved successfully",
      result: {
        data: users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { id } = req.params.userId;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (role !== undefined) {
      user.role = role;
    }
    if (status !== undefined) {
      user.status = status;
    }

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:userId", async (req, res) => {
  try {
    const { id } = req.params.userId;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
