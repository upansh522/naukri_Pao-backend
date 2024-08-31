const express = require('express');
const router = express.Router();
const { handleSignup, handleLogin, handleSignout } = require('../controllers/user');
const multer = require('multer');
const { handleJobPost } = require('../controllers/jobPost');
const { jobRecommendation } = require('../controllers/Jobrecommendation');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../uploads');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log(file);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf files are allowed!'), false);
    }
  }
});

// Route for user signup
router.post('/handleUserSignup', handleSignup);

// Route for user login
router.post('/handleUserLogin', handleLogin);
router.post('/handleJobPost', handleJobPost);
router.get('/handleJobRecommendation', jobRecommendation);
router.post('/handleSignout', handleSignout);

module.exports = router;
