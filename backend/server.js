const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files ──────────────────────────────────────────────
app.use("/certificates", express.static(path.join(__dirname, "certificates")));
app.use("/cards", express.static(path.join(__dirname, "cards")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Fix Admin (مؤقت) ─────────────────────────────────────────
const User = require("./models/User");
app.get("/fix-admin", async (req, res) => {
  const users = await User.find({});
  await User.updateMany({}, { $set: { role: "admin" } });
  res.json({ success: true, users: users.map(u => ({ email: u.email, role: u.role })) });
});

// ── Routes ────────────────────────────────────────────────────
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/admin", require("./routes/admin"));
// ...

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/student", require("./routes/student"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/courses", require("./routes/courses"));

app.get("/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date() }),
);

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
