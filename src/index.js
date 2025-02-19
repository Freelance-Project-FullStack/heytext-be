const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
// const dotenv = require("dotenv");
const morgan = require("morgan");
require("dotenv").config();

const errorHandler = require("./middleware/errorHandler");

const usersRouter = require("./routes/users");
const coursesRouter = require("./routes/courses");
// const fontsRouter = require("./routes/fonts");
const authRoutes = require("./routes/authRoutes");
const chatbotRoutes = require("./routes/chatbot");
const transaction = require("./routes/transactions");
const fontRoutes = require("./routes/fontRoutes");

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Heytext API",
      version: "1.0.0",
      description: "API documentation for Heytext application",
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PORT}`,
        description: "API server",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://heytext-fe.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("CDN-Cache-Control", "public, s-maxage=7200");
  next();
});

// Tối ưu cho serverless
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/mock-fonts", express.static(path.join(__dirname, "mock-fonts")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", usersRouter);
app.use("/api/courses", coursesRouter);
// app.use("/api/fonts", fontsRouter);
app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/transaction", transaction);
app.use("/api/fonts", fontRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Heytext API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

app.get("/api-docs", (req, res) => {
  res.json({
    version: "1.0",
    endpoints: {
      fonts: {
        get: "/api/v1/fonts",
        getById: "/api/v1/fonts/:id",
        create: "/api/v1/fonts",
        update: "/api/v1/fonts/:id",
        delete: "/api/v1/fonts/:id",
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  process.exit(1);
});

// Handle EADDRINUSE error
const server = app
  .listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
    console.log(
      `Swagger documentation is available at http://localhost:${process.env.PORT || 3000}/api-docs`
    );
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${process.env.PORT || 3000} is already in use. Please try another port.`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  server.close(() => {
    console.log("Server closed.");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});

module.exports = app;
