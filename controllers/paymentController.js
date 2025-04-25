const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Customer = require("../models/customerModel");

exports.createPaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // amount in paisa
      currency: "inr",
      metadata: { orderId: order._id.toString() },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe PaymentIntent Error:", err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};

// exports.confirmPayment = async (req, res) => {
//   const { orderId, paymentIntent } = req.body;

//   try {
//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const payment = new Payment({
//       order: orderId,
//       paymentMethod: "Stripe",
//       paymentDetails: paymentIntent.charges?.data[0]?.billing_details || {},
//       paymentStatus: "Completed",
//       transactionId: paymentIntent.id,
//       statusHistory: [{
//         status: "Completed",
//         updatedBy: order.customerId,
//       }],
//     });

//     const savedPayment = await payment.save();

//     order.paymentId = savedPayment._id;
//     await order.save();

//     res.status(200).json({ message: "Payment confirmed", paymentId: savedPayment._id });
//   } catch (err) {
//     console.error("Confirm Payment Error:", err);
//     res.status(500).json({ error: "Failed to confirm payment" });
//   }
// };




exports.confirmPayment = async (req, res) => {
  const { orderId, paymentIntent } = req.body;

  try {
    const order = await Order.findById(orderId).populate('subOrders.products.productId');
    if (!order) return res.status(404).json({ error: "Order not found" });

    //  Save payment
    const payment = new Payment({
      order: orderId,
      paymentMethod: "Stripe",
      paymentDetails: paymentIntent.charges?.data[0]?.billing_details || {},
      paymentStatus: "Completed",
      transactionId: paymentIntent.id,
      statusHistory: [{
        status: "Completed",
        updatedAt: new Date(),
        updatedBy: order.customerId,
      }],
    });

    const savedPayment = await payment.save();

    //  Update order
    order.paymentId = savedPayment._id;

    order.overallStatus = "Paid";
    order.overallStatusHistory.push({
      status: "Paid",
      updatedAt: new Date(),
      updatedBy: order.customerId,
    });


      // Update each suborder status
      order.subOrders.forEach(subOrder => {
        subOrder.status = "Paid"; // or "Paid" if you add that as a subOrder status
        subOrder.statusHistory.push({
          status: "Paid",
          updatedBy: order.customerId,
        });
      });

    await order.save();

    //  Reduce inventory
    for (const subOrder of order.subOrders) {
      for (const product of subOrder.products) {
        await Product.findByIdAndUpdate(product.productId, {
          $inc: { stock: -product.quantity }
        });
      }
    }

    // Clear backend cart
    await Customer.findByIdAndUpdate(order.customerId, {
      $set: { cart: [] }
    });

    res.status(200).json({ message: "Payment confirmed", paymentId: savedPayment._id });
  } catch (err) {
    console.error("Confirm Payment Error:", err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
};
