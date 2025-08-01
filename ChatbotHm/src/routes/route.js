const express = require("express");
const router = express.Router();
const apiController = require("../controller/apicontroller");

router
.get("/", apiController.verify)
.post("/", apiController.received);


module.exports = router;

