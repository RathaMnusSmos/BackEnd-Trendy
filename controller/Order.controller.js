// Import the necessary database and cart functions.
const db = require('../config/database/db.config')

// Function to get the user's cart by user ID
async function getCartByUserId(userId) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT cart.id AS cart_id, cart.product_item_id, cart.quantity,
               product_items.size, product_items.color, product_items.color_code,
               products.product_name, products.id AS product_id, products.product_price, products.product_discount
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
// Function to place an order

// Function to place an order
const placeOrder = async (req, res) => {
  try {
    const userId = req.user.user_id; // Get the authenticated user's ID
    const { shippingAddress } = req.body; // Extract shipping address from the request body
    const { cart } = await getCartByUserId(userId); // Retrieve the user's cart

    // Check if the cart is empty
    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Add items to your cart before placing an order.' });
    }
    // Calculate the total order amount based on cart items
    const totalAmount = calculateTotalAmount(cart);

    const orderInsertQuery = 'INSERT INTO orders (user_id, total_amount, payment_status, shipping_address) VALUES (?, ?, ?, ?)';
    const orderInsertParams = [userId, totalAmount, 'Pending', shippingAddress];

    db.query(orderInsertQuery, orderInsertParams, async (error, orderResult) => {
      if (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ error: 'Error creating order' });
      }

      const orderId = orderResult.insertId;

      try {
        // Insert order history items using Promise.all to ensure all insertions are complete before responding
        await Promise.all(cart.map(async (item) => {
          const orderHistoryInsertQuery = 'INSERT INTO order_history (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
          const orderHistoryInsertParams = [orderId, item.product_id, item.quantity, item.product_price];
          await db.query(orderHistoryInsertQuery, orderHistoryInsertParams);
        }));

        // Clear the user's cart after placing the order
        await clearUserCart(userId);

        // If all order history items are successfully inserted and cart is cleared, send the response
        res.status(201).json({
          message: 'Your order has been placed successfully.',
          orderDetails: {
            orderId,
            totalAmount,
            shippingAddress,
            items: cart,
          },
        });
      } catch (historyError) {
        console.error('Error creating order history:', historyError);
        return res.status(500).json({ error: 'Error creating order history' });
      }
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'An error occurred while placing the order.' });
  }
};

// Function to clear the user's cart after placing an order
async function clearUserCart(userId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM cart WHERE user_id = ?';
    db.query(query, [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}


// Function to initiate an order
const checkOutCart = async (req, res) => {
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

// Function to get the order history of a user by user ID
async function getOrderHistoryByUserId(req, res) {
  try {
    const userId = req.user.user_id;
    const orderHistory = await fetchOrderHistoryByUser(userId);
    res.json(orderHistory);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'An error occurred while fetching order history.' });
  }
}

// fect for 1 user 
async function fetchOrderHistoryByUser(userId) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT orders.order_id AS order_id, orders.total_amount, orders.payment_status, orders.shipping_address, 
    order_history.product_id, order_history.quantity, order_history.price,
    products.product_name, products.product_price, products.product_discount
FROM orders
JOIN order_history ON orders.order_id = order_history.order_id
JOIN products ON order_history.product_id = products.id
WHERE orders.user_id = ?;

        `;

    db.query(query, [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
// Function to get all orders for admin access
async function getAllOrdersForAdmin(req, res) {
  try {
    // Verify if the user accessing this endpoint is an admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Fetch all orders from the database
    const allOrders = await fetchAllOrders();

    // Return the orders with associated items in the desired format
    const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
      const userId = order.user_id;
      const user = await getUserInfo(userId);
      const items = await getOrderItems(order.order_id); // Fetch items associated with the order
      order.items = items; // Include items directly within the order object
      return {
        user,
        order,
      };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching all orders for admin:', error);
    res.status(500).json({ error: 'An error occurred while fetching all orders for admin.' });
  }
}

// Helper function to fetch items associated with an order from the database
async function getOrderItems(orderId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT order_history.product_id, order_history.quantity, order_history.price,
             products.product_name, products.product_price, products.product_discount
      FROM order_history
      JOIN products ON order_history.product_id = products.id
      WHERE order_history.order_id = ?;
    `;

    db.query(query, [orderId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Helper function to fetch all orders from the database
async function fetchAllOrders() {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT * FROM orders;
`;

    db.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Helper function to fetch user information from the database
async function getUserInfo(userId) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT * FROM users WHERE user_id = ?;
`;

    db.query(query, [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        // Assuming there's only one user with the given ID
        const user = results[0];
        resolve(user);
      }
    });
  });
}



module.exports = { checkOutCart, placeOrder, getOrderHistoryByUserId, getAllOrdersForAdmin };
