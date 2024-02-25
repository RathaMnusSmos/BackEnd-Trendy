// Import the necessary database and cart functions.
const db = require('../config/database/db.config')



// Function to get the user's cart by user ID
async function getCartByUserId(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT cart.id AS cart_id, cart.product_item_id, cart.quantity,
               product_items.size, product_items.color, product_items.color_code,
               products.product_name, products.product_price, products.product_discount
        FROM cart
        JOIN product_items ON cart.product_item_id = product_items.id
        JOIN products ON product_items.product_id = products.id
        WHERE cart.user_id = ?;
      `;
  
      db.query(query, [userId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve({ cart: results });
        }
      });
    });
  }
  

// Function to initiate an order
const checkOutCart = async(req, res) => {
    try {
      const userId = req.user.user_id; // Get the authenticated user's ID
      // Retrieve the user's cart based on userId (you should have a function for this)
      const userCart = await getCartByUserId(userId);
      // Check if the cart is empty
      if (userCart.cart.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty. Add items to your cart before initiating an order.' });
      }
  
      // Calculate the total order amount based on cart items
      const totalAmount = calculateTotalAmount(userCart.cart);
  
      // Place your order processing logic here (e.g., payment, order creation, etc.)
  
      // Return a success response or order confirmation
      return res.json({
        message: 'the cart is successfully checkout. here is your order: ',
        orderDetails: {
          items: userCart.cart,
          totalAmount,
          // Add any other order details here
        },
      });
    } catch (error) {
      console.error('Error initiating order:', error);
      res.status(500).json({ error: 'An error occurred while initiating the order.' });
    }
  };
  
  // Function to calculate the total amount based on cart items
  function calculateTotalAmount(cartItems) {
    return cartItems.reduce((total, item) => {
        // console.log("total = " + total)
        // console.log("product price = " + item.product_price)
        // console.log("product qty = " + item.quantity)
        // console.log("calculator = ",item.product_price ,'x', item.quantity ,' = ',item.product_price*item.quantity)
        // console.log("total = " + total)
      return total + item.product_price * item.quantity;
    }, 0);
  }
  
  module.exports = { checkOutCart };
