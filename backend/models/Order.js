const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderItemSchema = new Schema(
  {
    restaurantId: String,
    itemId: String,
    name: String,
    price: Number,
    qty: Number,
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    items: [OrderItemSchema],
    address: AddressSchema,
    subtotal: Number,
    deliveryFee: Number,
    packingCharges: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    paymentMethod: { type: String, default: "cod" },
    status: {
      type: String,
      enum: ["placed", "preparing", "out-for-delivery", "delivered", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);