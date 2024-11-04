const express = require('express');
const router = express.Router();
const isloggedin = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const orderModel = require('../models/order-model')
const { disconnect } = require('mongoose');


router.get("/",function(req,res){
    let error = req.flash("error");
    res.render("index",{error, loggedin: false});
}); 

router.get("/shop", isloggedin,async function(req,res){
    let products = await productModel.find();
    let success = req.flash("success");
    res.render("shop",{products,success});
});

router.get("/admin",isloggedin,async function(req,res){
    let products = await productModel.find();
    let user = await userModel.findOne({email: req.user.email});
    res.render("admin",{products,user});
})

router.get("/owneraccess",function(req,res){
    res.render("owner-login");
});


router.get("/profile", isloggedin, async function (req, res) {
    try {
        // Find the user and populate the orders field
        let user = await userModel.findOne({ email: req.user.email }).populate({
            path: 'orders',
            populate: {
                path: 'items.productId',
                model: 'product' // Ensure Product model is properly linked
            }
        });

        // Pass the user and populated orders data to the template
        res.render("profile", { user,owner:false });
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get("/cart", isloggedin, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart");
    let totalBill = 20; // Starting base fee

    // Create a map to store product counts and details
    let cartSummary = {};
    user.cart.forEach((item) => {
        if (cartSummary[item._id]) {
            // If the product already exists in the cart, increase the count
            cartSummary[item._id].count += 1;
        } else {
            // Add the product to the summary with initial count 1
            cartSummary[item._id] = {
                product: item,
                count: 1
            };
        }
    });

    // Calculate the total bill
    for (let key in cartSummary) {
        const item = cartSummary[key];
        totalBill += (Number(item.product.price) - Number(item.product.discount)) * item.count;
    }
    let remove = req.flash("remove");
    let added = req.flash("added");
    res.render("cart", { user, cartSummary, totalBill,remove,added });
});

router.post("/cart/decrease/:productid",isloggedin ,async function(req,res){
    try {
        const user = await userModel.findOne({ email: req.user.email }).populate('cart');
        const productId = req.params.productid;

        // Check if the product exists in the user's cart
        const productIndex = user.cart.findIndex(item => item._id.toString() === productId);

        if (productIndex > -1) {
            if (user.cart[productIndex].count > 1) {
                // Decrease the count if it's greater than 1
                user.cart[productIndex].count -= 1;
            } else {
                // Remove the product if the count is 1
                user.cart.splice(productIndex, 1);
            }

            // Update the cart in the database
            await userModel.updateOne(
                { email: req.user.email },
                { $set: { cart: user.cart } }
            );

            res.redirect('/cart');
        } else {
            res.status(404).send('Product not found in cart');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/cart/increase/:productid',isloggedin ,async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email }).populate('cart');
        const productId = req.params.productid;

        // Check if the product exists in the user's cart
        const productIndex = user.cart.findIndex(item => item._id.toString() === productId);

        if (productIndex > -1) {
            // Increase the count
            user.cart[productIndex].count += 1;
            // Update the cart in the database
            await userModel.updateOne(
                { email: req.user.email },
                { $set: { cart: user.cart } }
            );
            user.cart.push(req.params.productid);
            await user.save();
            req.flash("added","Product Added Successfully")
            res.redirect('/cart');
        } else {
            res.status(404).send('Product not found in cart');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).send('Internal Server Error');
    }
});



router.get("/addtocart/:productid", isloggedin, async function(req,res){
    let user = await userModel.findOne({email: req.user.email});
    user.cart.push(req.params.productid)
    await user.save();
    req.flash("success", "Added to cart");
    res.redirect("/shop");
})

// Route to handle placing an order
router.post('/cart/placeorder', isloggedin, async function (req, res) {
    try {
        let user = await userModel.findOne({ email: req.user.email }).populate('cart');

        // Check if the cart is not empty
        if (!user.cart.length) {
            req.flash("error", "Your cart is empty!");
            return res.redirect('/cart');
        }

        // Calculate the total order amount
        let orderDetails = user.cart.map(item => ({
            productId: item._id,
            name: item.name,
            quantity: 1, // You may update to store quantity if needed
            price: Number(item.price) - Number(item.discount)
        }));

        let totalAmount = orderDetails.reduce((total, item) => total + item.price, 20); // Base platform fee added

        // Create an order object and save it (you would need an order schema/model)
        const newOrder = await orderModel.create({
            user: user._id,
            items: orderDetails,
            totalAmount,
            date: new Date(),
        });
        
        
        
        // Save the order (assuming `orderModel` is your order schema)
        // Clear the user's cart
        user.orders.push(newOrder._id);
        user.cart = [];
        await user.save();

        req.flash("placed", "Order placed successfully!");
        res.redirect('/profile'); // Redirect to the profile or order confirmation page
    } catch (error) {
        console.error('Error placing the order:', error);
        res.status(500).send('Internal Server Error');
    }
});




router.get("/logout", isloggedin,function(req,res){
    res.render("shop");
})

module.exports = router;