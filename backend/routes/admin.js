
const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get all claims (Admin only)
router.get(
    "/claims",
    verifyToken,
    adminMiddleware,
    async (req, res) => {
        try {
            const [claims] = await db.query(`
                SELECT
                    c.id,
                    c.item_id,
                    c.claimant_id,
                    c.message,
                    c.status,
                    c.created_at,
                    i.item_name,
                    i.location,
                    i.report_type,
                    u.name AS claimant_name,
                    u.email AS claimant_email
                FROM claims c
                JOIN items i ON c.item_id = i.id
                JOIN users u ON c.claimant_id = u.id
                ORDER BY c.created_at DESC
            `);

            res.json({
                success: true,
                claims
            });
        } catch (error) {
            console.error("Admin claims error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to load claims"
            });
        }
    }
);

// Approve or reject a claim (Admin only)
router.patch(
    "/claims/:id/status",
    verifyToken,
    adminMiddleware,
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const { status } = req.body;
            const claimId = req.params.id;

            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid claim status"
                });
            }

            await connection.beginTransaction();

            const [claims] = await connection.query(
                `SELECT c.id, c.item_id, c.status,
                        i.status AS item_status
                 FROM claims c
                 JOIN items i ON c.item_id = i.id
                 WHERE c.id = ?
                 FOR UPDATE`,
                [claimId]
            );

            if (claims.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "Claim not found"
                });
            }

            const claim = claims[0];

            if (claim.status !== "pending") {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: "This claim has already been reviewed"
                });
            }

            if (status === "approved" && claim.item_status !== "active") {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: "This item is no longer available"
                });
            }

            await connection.query(
                "UPDATE claims SET status = ? WHERE id = ?",
                [status, claimId]
            );

            if (status === "approved") {
                await connection.query(
                    "UPDATE items SET status = 'claimed' WHERE id = ?",
                    [claim.item_id]
                );

                await connection.query(
                    `UPDATE claims
                     SET status = 'rejected'
                     WHERE item_id = ?
                     AND id != ?
                     AND status = 'pending'`,
                    [claim.item_id, claimId]
                );
            }

            await connection.commit();

            res.json({
                success: true,
                message: `Claim ${status} successfully`
            });

        } catch (error) {
            await connection.rollback();

            console.error("Claim review error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to update claim"
            });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;
