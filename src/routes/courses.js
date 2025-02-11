const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// Get all courses
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Sử dụng lean() để tối ưu performance

    // Cache response
    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=300");

    return res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add new wish
router.post("/", async (req, res) => {
  const wish = new Course({
    sender: req.body.sender,
    content: req.body.content,
  });

  try {
    const newCourse = await wish.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
