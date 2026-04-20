const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  markCompleted,
  sendCertificate,
  generateCard,
  exportExcel,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/complete/:id", markCompleted);
router.post("/send-certificate/:id", sendCertificate);
router.post("/generate-card/:id", generateCard);
router.get('/export-excel', exportExcel);

module.exports = router;
