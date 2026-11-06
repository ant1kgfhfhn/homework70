const express = require("express");
const ensureAuthenticated = require("../middlewares/authMiddleware");

const {
  findUsers,
  streamUsers,
  getUserStats,
  insertOne,
  insertMany,
  updateOne,
  updateMany,
  replaceOne,
  deleteOne,
  deleteMany,
} = require("../controllers/userApiController");

const router = express.Router();

// All API routes require authentication
router.use(ensureAuthenticated);

// Cursor and aggregation routes
router.get("/cursor", streamUsers);
router.get("/stats", getUserStats);

// Read users with find() and projection
router.get("/", findUsers);

// Create
router.post("/bulk", insertMany);
router.post("/", insertOne);

// Update
router.patch("/bulk/update", updateMany);
router.patch("/:id", updateOne);

// Replace
router.put("/:id/replace", replaceOne);

// Delete
router.delete("/bulk", deleteMany);
router.delete("/:id", deleteOne);

module.exports = router;
