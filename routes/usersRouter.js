const express = require('express');
const userModel = require('../models/user-model');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../utils/generateToken')
const {registerUser,loginUser,logout} = require('../controllers/authController');


router.get("/",function(req,res){
    res.send("Hey we are on users Router")
});
router.post("/register",registerUser);

router.post("/login", loginUser);

router.get("/logout", logout);

module.exports = router;