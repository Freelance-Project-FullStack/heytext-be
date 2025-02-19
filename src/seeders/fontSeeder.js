const mongoose = require("mongoose");
const Font = require("../models/Font");

const categories = [
  "Sans Serif",
  "Serif",
  "Display",
  "Handwriting",
  "Monospace",
  "Calligraphy",
];
const styles = [
  "Regular",
  "Bold",
  "Italic",
  "Light",
  "Medium",
  "Black",
  "Thin",
];
const uses = [
  "Website",
  "Print",
  "Branding",
  "Logo",
  "Advertising",
  "Packaging",
  "Editorial",
];
const tags = [
  "modern",
  "classic",
  "elegant",
  "vintage",
  "decorative",
  "minimalist",
  "professional",
  "playful",
  "geometric",
  "organic",
  "retro",
  "clean",
  "bold",
  "script",
  "grunge",
];

const generateRandomFont = (index) => {
  // Generate random name
  const fontNames = [
    "Nova",
    "Stellar",
    "Quantum",
    "Echo",
    "Vertex",
    "Prism",
    "Flux",
    "Zenith",
    "Atlas",
    "Nexus",
    "Cipher",
    "Vector",
    "Pulse",
    "Orbit",
    "Matrix",
  ];
  const fontVariants = [
    "Pro",
    "Sans",
    "Display",
    "Text",
    "Neue",
    "Light",
    "Modern",
    "Classic",
  ];

  const name = `${fontNames[Math.floor(Math.random() * fontNames.length)]} ${
    fontVariants[Math.floor(Math.random() * fontVariants.length)]
  } ${index + 1}`;

  // Generate random description
  const descriptions = [
    "A versatile font perfect for modern designs",
    "Elegant typeface suitable for professional use",
    "Bold and distinctive font for impactful headlines",
    "Clean and minimalist design for optimal readability",
    "Classic style with contemporary touches",
  ];

  // Generate random data
  const randomCategory =
    categories[Math.floor(Math.random() * categories.length)];
  const randomStyles = Array.from(
    { length: Math.floor(Math.random() * 3) + 1 },
    () => styles[Math.floor(Math.random() * styles.length)]
  );
  const randomUses = Array.from(
    { length: Math.floor(Math.random() * 3) + 1 },
    () => uses[Math.floor(Math.random() * uses.length)]
  );
  const randomTags = Array.from(
    { length: Math.floor(Math.random() * 4) + 1 },
    () => tags[Math.floor(Math.random() * tags.length)]
  );

  // Generate random metrics
  const downloads = Math.floor(Math.random() * 2000);
  const views = Math.floor(Math.random() * 3000);
  const rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3.0 and 5.0
  const price = Math.floor(Math.random() * 50) * 2; // Even prices up to 98

  // Generate random dates within the last year
  const startDate = new Date(2023, 0, 1);
  const endDate = new Date();
  const randomDate = new Date(
    startDate.getTime() +
      Math.random() * (endDate.getTime() - startDate.getTime())
  );

  return {
    name,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    category: randomCategory,
    styles: randomStyles,
    uses: randomUses,
    price,
    downloads,
    views,
    rating,
    isActive: Math.random() > 0.1, // 90% chance of being active
    fontUrl: `/mock-fonts/${index + 1}.ttf`,
    tags: randomTags,
    createdAt: randomDate,
  };
};

const seedFonts = async () => {
  try {
    // Clear existing fonts
    await Font.deleteMany({});

    // Generate 100 fonts
    const fonts = Array.from({ length: 100 }, (_, index) =>
      generateRandomFont(index)
    );

    // Insert fonts
    await Font.insertMany(fonts);

    console.log("Successfully seeded 100 fonts!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding fonts:", error);
    process.exit(1);
  }
};

// Connect to MongoDB and run seeder
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://pp072003:thinhpq@yaytext.hcsew.mongodb.net/heytext"
  )
  .then(() => {
    console.log("Connected to MongoDB");
    seedFonts();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
