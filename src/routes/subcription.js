const Subscription = require("../models/Subscription");

const createSubscription = async () => {
  try {
    const newSubscription = new Subscription({
      name: "Premium Plan",
      description: "Access to all premium features.",
      price: 19.99,
      duration: "monthly",
    });

    await newSubscription.save();
    console.log("Subscription created:", newSubscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
  }
};

createSubscription();
