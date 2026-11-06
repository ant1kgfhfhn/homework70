const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { once } = require("events");
const User = require("../models/User");

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicUser(user) {
  if (!user) return user;

  const result = user.toObject ? user.toObject() : user;
  const { password, ...safeUser } = result;

  return safeUser;
}

// GET /api/users
async function findUsers(req, res, next) {
  try {
    let query = User.find();

    if (req.query.fields === "email") {
      query = query.select("_id email createdAt");
    } else {
      query = query.select("-password");
    }

    const result = await query.sort({ createdAt: -1 }).lean();

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// GET /api/users/cursor
async function streamUsers(req, res, next) {
  const cursor = User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .lean()
    .cursor({ batchSize: 100 });

  try {
    res.status(200);
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    res.write("[");

    let first = true;

    for await (const user of cursor) {
      if (!first) {
        res.write(",");
      }

      first = false;

      const canContinue = res.write(JSON.stringify(user));

      if (!canContinue) {
        await once(res, "drain");
      }
    }

    res.end("]");
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error);
    } else {
      next(error);
    }
  } finally {
    await cursor.close().catch(() => {});
  }
}

// GET /api/users/stats
async function getUserStats(req, res, next) {
  try {
    const pipeline = [
      {
        $match: {
          email: { $type: "string" },
        },
      },
      {
        $project: {
          domain: {
            $toLower: {
              $arrayElemAt: [{ $split: ["$email", "@"] }, 1],
            },
          },
        },
      },
      {
        $group: {
          _id: "$domain",
          userCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          userCount: -1,
          _id: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: "$userCount" },
          uniqueDomains: { $sum: 1 },
          domains: {
            $push: {
              domain: "$_id",
              userCount: "$userCount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          uniqueDomains: 1,
          domains: 1,
        },
      },
    ];

    const result = await User.aggregate(pipeline);

    res.json(
      result[0] || {
        totalUsers: 0,
        uniqueDomains: 0,
        domains: [],
      },
    );
  } catch (error) {
    next(error);
  }
}

// POST /api/users
async function insertOne(req, res, next) {
  try {
    const { email, password } = req.body;

    if (
      !validEmail(email) ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        error: "Provide a valid email and a password of at least 6 characters.",
      });
    }

    const user = await User.create({
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({
      message: "User created",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists.",
      });
    }

    next(error);
  }
}

// POST /api/users/bulk
async function insertMany(req, res, next) {
  try {
    const { users: inputUsers } = req.body;

    if (!Array.isArray(inputUsers) || inputUsers.length === 0) {
      return res.status(400).json({
        error: "Send a non-empty users array.",
      });
    }

    if (
      inputUsers.some(
        (user) =>
          !validEmail(user.email) ||
          typeof user.password !== "string" ||
          user.password.length < 6,
      )
    ) {
      return res.status(400).json({
        error:
          "Every user needs a valid email and a password of at least 6 characters.",
      });
    }

    const documents = await Promise.all(
      inputUsers.map(async (user) => ({
        email: user.email.trim().toLowerCase(),
        password: await bcrypt.hash(user.password, 10),
      })),
    );

    const result = await User.insertMany(documents, {
      ordered: true,
    });

    res.status(201).json({
      message: "Users created",
      insertedCount: result.length,
      insertedIds: result.map((user) => user._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "An email already exists.",
      });
    }

    next(error);
  }
}

// PATCH /api/users/:id
async function updateOne(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid user ID.",
      });
    }

    const { email } = req.body;

    if (!validEmail(email)) {
      return res.status(400).json({
        error: "Provide a valid email.",
      });
    }

    const result = await User.updateOne(
      { _id: req.params.id },
      {
        $set: {
          email: email.trim().toLowerCase(),
        },
      },
      { runValidators: true },
    );

    res.json({
      message: result.matchedCount ? "Update completed" : "User not found",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists.",
      });
    }

    next(error);
  }
}

// PATCH /api/users/bulk/update
async function updateMany(req, res, next) {
  try {
    const { filter, email } = req.body;

    if (!filter || typeof filter.email !== "string" || !validEmail(email)) {
      return res.status(400).json({
        error: "Provide filter.email and a valid new email.",
      });
    }

    const result = await User.updateMany(
      {
        email: filter.email.trim().toLowerCase(),
      },
      {
        $set: {
          email: email.trim().toLowerCase(),
        },
      },
      { runValidators: true },
    );

    res.json({
      message: "Bulk update completed",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists.",
      });
    }

    next(error);
  }
}

// PUT /api/users/:id/replace
async function replaceOne(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid user ID.",
      });
    }

    const { email, password } = req.body;

    if (
      !validEmail(email) ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        error: "Provide a valid email and a password of at least 6 characters.",
      });
    }

    const replacement = {
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
    };

    const result = await User.replaceOne({ _id: req.params.id }, replacement, {
      runValidators: true,
    });

    res.json({
      message: result.matchedCount ? "Replacement completed" : "User not found",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists.",
      });
    }

    next(error);
  }
}

// DELETE /api/users/:id
async function deleteOne(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid user ID.",
      });
    }

    const result = await User.deleteOne({
      _id: req.params.id,
    });

    res.json({
      message: result.deletedCount ? "User deleted" : "User not found",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/users/bulk
async function deleteMany(req, res, next) {
  try {
    const { filter } = req.body;

    if (
      !filter ||
      typeof filter.email !== "string" ||
      !validEmail(filter.email)
    ) {
      return res.status(400).json({
        error:
          "Provide a valid filter.email to prevent accidental mass deletion.",
      });
    }

    const result = await User.deleteMany({
      email: filter.email.trim().toLowerCase(),
    });

    res.json({
      message: "Bulk delete completed",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
