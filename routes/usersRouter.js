const express = require('express');
const router = express.Router();


router.get("/",function(req,res){
    res.send("Hey we are on users Router")
})

module.exports = router;