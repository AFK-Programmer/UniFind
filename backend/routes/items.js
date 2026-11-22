
const upload = require("../middleware/upload");
const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE LOST OR FOUND ITEM
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const {
            item_name,
            category,
            description,
            location,
            report_type,
            item_date
        } = req.body;

        if (!item_name || !location || !report_type) {
            return res.status(400).json({
                success: false,
                message: "Item name, location and report type are required"
            });
        }

        if (!["lost", "found"].includes(report_type)) {
            return res.status(400).json({
                success: false,
                message: "Report type must be lost or found"
            });
        }

        // Get uploaded image path
        const imagePath = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        // Insert item into database
        const [result] = await db.query(
            `INSERT INTO items
            (user_id, item_name, category, description,
             location, report_type, item_date, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                item_name,
                category || null,
                description || null,
                location,
                report_type,
                item_date || null,
                imagePath
            ]
        );

        res.status(201).json({
            success: true,
            message: "Item reported successfully",
            itemId: result.insertId,
            imagePath: imagePath
        });

    } catch (error) {
        console.error("Item report error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to report item"
        });
    }
});


// GET ALL LOST AND FOUND ITEMS
router.get("/", async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT
                items.*,
                users.name AS reporter_name
             FROM items
             JOIN users ON items.user_id = users.id
             ORDER BY items.created_at DESC`
        );

        res.json({
            success: true,
            count: items.length,
            items
        });

    } catch (error) {
        console.error("Get items error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch items"
        });
    }
});


// GET ITEMS BY REPORT TYPE
router.get("/type/:type", async (req, res) => {
    try {
        const { type } = req.params;

        if (!["lost", "found"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item type"
            });
        }

        const [items] = await db.query(
            `SELECT
                items.*,
                users.name AS reporter_name
             FROM items
             JOIN users ON items.user_id = users.id
             WHERE items.report_type = ?
             ORDER BY items.created_at DESC`,
            [type]
        );

        res.json({
            success: true,
            items
        });

    } catch (error) {
        console.error("Filter items error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to filter items"
        });
    }
});

module.exports = router;
