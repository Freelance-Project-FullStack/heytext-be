const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const mongoose = require("mongoose");
const handleError = (res, error, message = "Internal server error", status = 500) => {
  console.error(message, error);
  return res.status(status).json({ status: "error", message });
};

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
      status: "success",
      message: "Data retrieved successfully",
      result: {
        data: courses,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleError(res, error, "Error fetching courses");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid course ID" });
    }

    const course = await Course.findById(id).lean();

    if (!course) {
      return res.status(404).json({ status: "error", message: "Course not found" });
    }

    return res.json({ status: "success", message: "Course retrieved successfully", data: course });
  } catch (error) {
    return handleError(res, error, "Error fetching course");
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, price, description, image, auth, content, courseUrl } = req.body;

    if (!name || !price || !description) {
      return res.status(400).json({ status: "error", message: "All fields are required" });
    }

    const newCourse = new Course({
      name,
      price,
      description,
      image,
      auth: "admin",
      content: "",
      courseUrl: "",
    });

    await newCourse.save();

    return res.status(201).json({ status: "success", message: "Course created successfully", data: newCourse });
  } catch (error) {
    return handleError(res, error, "Error creating course", 400);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid course ID" });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ status: "error", message: "Course not found" });
    }

    return res.status(200).json({
      status: "success",
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    return handleError(res, error, "Error updating course");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid course ID" });
    }

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ status: "error", message: "Course not found" });
    }

    return res.json({ status: "success", message: "Course deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Error deleting course");
  }
});

module.exports = router;