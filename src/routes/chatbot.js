const express = require("express");
const { genContent } = require("../controllers/chatbotController");
const router = express.Router();

router.post("/generate", genContent);



module.exports = router;