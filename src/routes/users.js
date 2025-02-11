const express = require("express");
const router = express.Router();
const User = require("../models/User");
const crypto = require("crypto");

// Get user by invitation code
router.get("/:code", async (req, res) => {
  try {
    const user = await User.findOne({ invitationCode: req.params.code });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user with auto-generated invitation code
router.post("/", async (req, res) => {
  try {
    const invitationCode = crypto.randomBytes(3).toString("hex");
    const user = new User({
      ...req.body,
      invitationCode,
    });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user RSVP
router.put("/:code", async (req, res) => {
  try {
    const user = await User.findOne({ invitationCode: req.params.code });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.isAttending !== undefined) {
      user.isAttending = req.body.isAttending;
    }
    if (req.body.phoneNumber) {
      user.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.numberOfUsers) {
      user.numberOfUsers = req.body.numberOfUsers;
    }
    if (req.body.message) {
      user.message = req.body.message;
    }
    user.status = req.body.isAttending === true ? "confirmed" : "declined";

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users with filters (admin only)
router.get("/", async (req, res) => {
  try {
    const {
      invitedBy,
      isAttending,
      status,
      search,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (invitedBy) query.invitedBy = invitedBy;
    if (isAttending !== undefined) query.isAttending = isAttending === "true";
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user statistics
router.get("/statistics", async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalConfirmed: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          totalDeclined: {
            $sum: { $cond: [{ $eq: ["$status", "declined"] }, 1, 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          totalAttendees: {
            $sum: {
              $cond: [{ $eq: ["$isAttending", true] }, "$numberOfUsers", 0],
            },
          },
          byInvitedBy: {
            $push: {
              k: "$invitedBy",
              v: 1,
            },
          },
        },
      },
      {
        $addFields: {
          byInvitedBy: {
            $arrayToObject: "$byInvitedBy",
          },
        },
      },
    ]);

    res.json(
      stats[0] || {
        totalUsers: 0,
        totalConfirmed: 0,
        totalDeclined: 0,
        totalPending: 0,
        totalAttendees: 0,
        byInvitedBy: {},
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk update user table assignments
router.put("/bulk/table-assignment", async (req, res) => {
  try {
    const { assignments } = req.body; // Format: [{userId: '...', table: 1}, ...]

    const updates = assignments.map(({ userId, table }) => ({
      updateOne: {
        filter: { _id: userId },
        update: { $set: { table } },
      },
    }));

    await User.bulkWrite(updates);
    res.json({ message: "Table assignments updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
