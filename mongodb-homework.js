use("studentDB");

// 1. Create collection
db.createCollection("assignments");

// 2. Insert five students
db.assignments.insertMany([
  { name: "Alex", subject: "Math", score: 92 },
  { name: "Anna", subject: "English", score: 78 },
  { name: "Michael", subject: "Math", score: 85 },
  { name: "Sophia", subject: "Physics", score: 73 },
  { name: "David", subject: "English", score: 88 },
]);

// 3. Find students with score greater than 80
db.assignments.find({ score: { $gt: 80 } });

// 4. Increase Anna's score by 5
db.assignments.updateOne(
  { name: "Anna", score: { $lt: 85 } },
  { $inc: { score: 5 } },
);

// 5. Delete the student with the lowest score
db.assignments.deleteOne({
  _id: db.assignments.find().sort({ score: 1 }).limit(1).next()._id,
});

// 6. Projection: show only name and score
db.assignments.find({}, { _id: 0, name: 1, score: 1 });

// 7. Aggregation: average score by subject
db.assignments.aggregate([
  {
    $group: {
      _id: "$subject",
      averageScore: { $avg: "$score" },
    },
  },
  {
    $match: {
      averageScore: { $gt: 75 },
    },
  },
]);

// 8. Create unique index
db.assignments.createIndex({ name: 1 }, { unique: true });

// 9. Find names starting with A
db.assignments.find({
  name: { $regex: "^A" },
});

// 10. Explain index usage
db.assignments
  .find({
    name: { $regex: "^A" },
  })
  .explain("executionStats");

// 11. Explain collection scan without index
db.assignments
  .find({
    name: { $regex: "^A" },
  })
  .hint({ $natural: 1 })
  .explain("executionStats");
