
const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Submit a claim
router.post("/", verifyToken, async (req, res) => {
    try {
        const { item_id, message } = req.body;
        const claimantId = req.user.id;

        if (!item_id) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required"
            });
        }

        // Check whether item exists and can be claimed
        const [items] = await db.query(
            `SELECT id, user_id, report_type, status
             FROM items WHERE id = ?`,
            [item_id]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        const item = items[0];

        if (item.report_type !== "found" || item.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "This item cannot be claimed"
            });
        }

        if (item.user_id === claimantId) {
            return res.status(403).json({
                success: false,
                message: "You cannot claim your own item"
            });
        }

        const [result] = await db.query(
            `INSERT INTO claims
             (item_id, claimant_id, message)
             VALUES (?, ?, ?)`,
            [item_id, claimantId, message || null]
        );

        res.status(201).json({
            success: true,
            message: "Claim submitted successfully",
            claimId: result.insertId
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "You have already claimed this item"
            });
        }

        console.error("Claim error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while submitting claim"
        });
    }
});

module.exports = router;
