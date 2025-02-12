const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: String,
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    message: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Authentication related fields
    loginMethod: {
      type: String,
      enum: ["google", "manual"],
      required: true, // This ensures we always track the login method
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.loginMethod === "manual"; // Password is only required for manual login
      },
    },
    googleId: {
      type: String,
      required: function () {
        return this.loginMethod === "google"; // Google ID is required for Google login
      },
    },
    googleToken: {
      type: String, // Token for interacting with Google APIs (optional, based on your requirements)
    },
    avatar: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("User", userSchema);
