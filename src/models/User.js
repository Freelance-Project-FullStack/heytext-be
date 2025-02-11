const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    invitedName: {
      type: String,
      required: true,
    },
    phoneNumber: String,
    numberOfGuests: {
      type: Number,
      default: 1,
    },
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
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("Guest", guestSchema);
