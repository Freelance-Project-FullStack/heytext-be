const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: String,
    isAttending: {
      type: Boolean,
      default: false,
    },
    invitationCode: {
      type: String,
      unique: true,
      required: true,
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
      required: function () {
        return this.loginMethod !== "google"; // Email is required for manual login
      },
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
    googleEmail: {
      type: String,
      required: function () {
        return this.loginMethod === "google"; // Google Email is required for Google login
      },
      unique: true,
    },
    googleToken: {
      type: String, // Token for interacting with Google APIs (optional, based on your requirements)
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("User", userSchema);
