const claimRoutes = require("./routes/claims");
const path = require("path");
const itemRoutes = require("./routes/items");
const authRoutes = require("./routes/auth");
const verifyToken = require("./middleware/authMiddleware");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);

app.get("/api/auth/me", verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "You are authenticated!",
        user: req.user
    });
});

app.get("/", (req, res) => {
    res.send("UniFind Backend is Running!");
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "MySQL Connected Successfully!",
            databaseTest: rows[0].result
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database Connection Failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`UniFind Backend running on port ${PORT}`);
});
