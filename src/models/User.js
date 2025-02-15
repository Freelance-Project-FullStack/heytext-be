const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
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
      required: false,
    },
    // subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

// Add compound index for faster queries
userSchema.index({ email: 1, loginMethod: 1 });

// Add any necessary pre-save middleware
userSchema.pre("save", function (next) {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
