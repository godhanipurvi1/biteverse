const Cart = require("../models/Cart");


// GET CART

exports.getCart = async(req,res)=>{

try{

const cart = await Cart.findOne({
    userId:req.params.userId
});


res.json(cart || {
    items:[],
    totalPrice:0
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};





// ADD TO CART

exports.addToCart = async(req,res)=>{

try{


const {
userId,
foodId,
name,
price,
image
}=req.body;



let cart = await Cart.findOne({
userId
});



if(!cart){

cart = new Cart({
userId,
items:[],
totalPrice:0
});

}




const existingItem =
cart.items.find(
item=>item.foodId.toString() === foodId
);



if(existingItem){

existingItem.quantity += 1;

}
else{

cart.items.push({

foodId,
name,
price,
image,
quantity:1

});

}



cart.totalPrice =
cart.items.reduce(
(sum,item)=>
sum + item.price * item.quantity,
0
);



await cart.save();



res.json(cart);



}catch(error){

res.status(500).json({
message:error.message
});

}

};





// REMOVE ITEM

exports.removeFromCart = async(req,res)=>{

try{


const {
userId
}=req.body;



let cart =
await Cart.findOne({
userId
});



cart.items =
cart.items.filter(
item =>
item.foodId.toString()
!== req.params.id
);



cart.totalPrice =
cart.items.reduce(
(sum,item)=>
sum + item.price * item.quantity,
0
);



await cart.save();


res.json(cart);



}catch(error){

res.status(500).json({
message:error.message
});

}

};