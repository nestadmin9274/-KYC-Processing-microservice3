const express = require("express");
const db = require("../config/database"); 

const router = express.Router();

router.get("/", async (req, res) => {
    console.log("HEALTH CHECK BEGIN");

    let databaseStatus = "DOWN";
    let hypervergeAPI = "DOWN";

    try {
        // 1. Database Check
        await db.query("SELECT 1");
        databaseStatus = "Connected";
    } catch (error) {
        console.error("❌ Database Connection Failed:", error.message);
    }

 

    // Determine overall status
    const overallStatus = [databaseStatus, hypervergeAPI].includes("DOWN")
        ? "DOWN"
        : "UP";

    res.status(overallStatus === "UP" ? 200 : 500).json({
        message: "User Profile Microservice Health Check",
        status: overallStatus,
        uptime: process.uptime(),
        database: databaseStatus,
        hypervergeAPI,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
