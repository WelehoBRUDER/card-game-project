const express = require("express");
const router = express.Router();

router.get("/", (req, res)=>{
  res.send({response: "Received!"}).status(200);
});

module.exports = router;