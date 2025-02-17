const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { signup, login, loginwithGoogle } = require("../controllers/authController");

// Signup route
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 characters long"),
  ],
  signup
);

// Login route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 characters long"),
  ],
  login
);

router.post("/google", loginwithGoogle);

module.exports = router;
