const express = require("express");
const multer = require("multer");
const { uniqueUploadFilename } = require("../utils/uploadFilename");
const {
  getPhotographers,
  getPhotographerById,
  createPhotographer,
  updatePhotographer,
  deletePhotographer,
  viewPhotographer,
} = require("../controllers/photographerController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/photographers/');
  },
  filename: function (req, file, cb) {
    cb(null, uniqueUploadFilename(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

const router = express.Router();

router.get("/", getPhotographers);
router.get("/:id", getPhotographerById);
router.post("/", protect, authorize("PROVIDER", "ADMIN"), upload.array('images', 5), createPhotographer);
router.put("/:id", protect, authorize("PROVIDER", "ADMIN"), upload.array('images', 5), updatePhotographer);
router.delete("/:id", protect, authorize("PROVIDER", "ADMIN"), deletePhotographer);
router.post("/:id/view", protect, viewPhotographer);

module.exports = router;