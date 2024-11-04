const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model');
const userModel = require('../models/user-model');

// WE CAN SET NODE_ENV ENVIRONMENT -> export NODE_ENV=development
if(process.env.NODE_ENV === "development"){
    router.post("/create",async function(req,res){
        let owners = await ownerModel.find();
        if(owners.length > 0) return res.status(503).send("You are creating more than one owner of this website");
        let{fullname,email,password}  =req.body;
        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password
        })
        res.send(createdOwner);
    })
}


router.get("/admin",function(req,res){
    let success = req.flash("success");
    res.render("createproducts",{success}) ;
})



module.exports = router; 