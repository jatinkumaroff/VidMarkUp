require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

// DNS prblm - mongo atlas ka cloudflare ke sath dns issue bypass karne ke liye
const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/videos", require("./routes/videos"));
app.use("/api/markers", require("./routes/markers"));
app.use("/api/export", require("./routes/export"));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
