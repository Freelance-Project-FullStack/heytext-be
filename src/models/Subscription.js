const mongoose = require("mongoose");

// Define the Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: String, // e.g., "monthly", "yearly"
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Optionally, you can define methods, virtuals, etc.
subscriptionSchema.methods.getFormattedPrice = function () {
  return `$${this.price.toFixed(2)}`;
};

// Create and export the model
const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
