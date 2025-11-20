/**
 * Express server main file
 */
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { testConnection } = require("./config/dbConnection");

// Import routes
const parksRoutes = require("./routes/parksRoutes");
const facilitiesRoutes = require("./routes/facilitiesRoutes");
const trailsRoutes = require("./routes/trailsRoutes");
const reviewsRoutes = require("./routes/reviewsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");
const storedProcedureRoutes = require("./routes/storedProcedureRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/parks", parksRoutes);
app.use("/api/facilities", facilitiesRoutes);
app.use("/api/trails", trailsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/stored-procedures", storedProcedureRoutes);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// Root path - serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Health check
app.get("/health", async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: "ok",
    database: dbStatus ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

// Start server
async function startServer() {
  // Test database connection
  console.log("Testing database connection...");
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error(
      "❌ Cannot connect to database, please check configuration"
    );
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log("=".repeat(60));
    console.log("API Endpoints:");
    console.log(`  GET  /api/parks`);
    console.log(`  GET  /api/facilities`);
    console.log(`  GET  /api/trails`);
    console.log(`  GET  /api/reviews`);
    console.log(`  POST /api/users/register`);
    console.log(`  POST /api/users/login`);
    console.log("=".repeat(60));
  });
}

startServer();

