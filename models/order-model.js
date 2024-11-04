const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user' 
    },
    items: [
        {
            productId: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'product' 
            },
            name: String,
            quantity: Number,
            price: Number,
        },
    ],
    totalAmount: Number,
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('order', orderSchema);