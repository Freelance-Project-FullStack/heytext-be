const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const search = req.query.search || "";

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Course.countDocuments(query);

    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=300");

    return res.json({
      data: courses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findOne({ id: req.params.id });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newCourse = new Course({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: req.body.image,
      auth: req.body.auth,
      content: req.body.content,
      courseUrl: req.body.courseUrl
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedCourse = await Course.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 📌 Xóa khóa học theo id
router.delete("/:id", async (req, res) => {
  try {
    const deletedCourse = await Course.findOneAndDelete({ id: req.params.id });

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
