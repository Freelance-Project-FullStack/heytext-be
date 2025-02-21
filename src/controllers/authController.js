const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const passport = require("passport"); // If using passport for Google OAuth
const User = require("../models/User");

const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.callbackURL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, email, name } = profile;
      let user = await User.findOne({ googleId: id });

      if (!user) {
        user = new User({
          name,
          googleId: id,
          googleEmail: email,
          googleToken: accessToken,
          loginMethod: "google",
        });
        await user.save();
      }

      done(null, user);
    }
  )
);
// Signup - Manual or Google
exports.signup = async (req, res) => {
  const {
    name,
    email,
    password,
    loginMethod,
    googleId,
    googleEmail,
    googleToken,
  } = req.body;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If loginMethod is 'manual', validate password
    if (loginMethod === "manual") {
      if (!password) {
        return res
          .status(400)
          .json({ error: "Password is required for manual login" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        loginMethod,
      });

      await newUser.save();
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({ token, user: newUser });
    }

    // If loginMethod is 'google', handle Google login/signup
    if (loginMethod === "google") {
      const existingUser = await User.findOne({ googleId });
      if (existingUser) {
        const token = jwt.sign(
          { userId: existingUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
        return res.status(200).json({ token, user: existingUser });
      }

      const newGoogleUser = new User({
        name,
        email: googleEmail,
        googleId,
        googleEmail,
        googleToken,
        loginMethod,
      });

      await newGoogleUser.save();
      const token = jwt.sign(
        { userId: newGoogleUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({ token, user: newGoogleUser });
    }
  } catch (error) {
    res.status(500).json({ message: "Error during signup", error });
  }
};

// Login - Manual login or Google login
exports.login = async (req, res) => {
  const { email, password, loginMethod, googleToken } = req.body;

  try {
    if (loginMethod === "manual") {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (user.status === false) {
        return res.status(400).json({ message: "User is blocked" });
      }

      const isMatch = bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      return res.status(200).json({ token, user });
    }

    // If loginMethod is 'google', handle Google login
    if (loginMethod === "google") {
      passport.authenticate("google", { session: false }, (err, user, info) => {
        if (err || !user) {
          return res
            .status(400)
            .json({ message: "Google authentication failed", error: err });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
          expiresIn: "12h",
        });
        return res.status(200).json({ token, user });
      })(req, res);
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // req.user đã được set bởi authMiddleware
    const user = req.user;

    const userWithDetails = await User.findById(user._id);

    res.json(userWithDetails);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng" });
  }
};

exports.loginwithGoogle = async (req, res) => {
  const { name, email, googleid } = req.body;

  try {
    let user = await User.findOne({ email: email });
    if (!user) {
      user = new User({
        name,
        email,
        googleId: googleid,
        loginMethod: "google",
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error during Google login", error });
  }
};
