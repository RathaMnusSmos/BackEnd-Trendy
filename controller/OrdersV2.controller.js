const db = require('../config/database/db.config')

const checkout = (req, res) => {
    const authenticatedUserId = req.user.user_id;

    // Check if the authenticated user matches the user in the request
    if (authenticatedUserId) {
        const query = `
            SELECT users.user_id AS user_id, users.username, users.phone, users.email, users.gender, cart.id AS cart_id, product_items.*, products.product_name, products.product_price, products.product_discount, cart.quantity
            FROM users
            JOIN cart ON users.user_id = cart.user_id
            JOIN product_items ON cart.product_item_id = product_items.id
            JOIN products ON product_items.product_id = products.id
            WHERE cart.user_id = ?;
        `;

        db.query(query, [authenticatedUserId], async (err, results) => {
            if (err) {
                console.error('Error fetching user cart:', err);
                return res.status(500).json({ error: 'Error fetching user cart' });
            }

            // Check if there are no results
            if (!results || results.length === 0) {
                return res.json({ message: 'User cart is empty' });
            }

            // Calculate total amount and total amount after discount
            let totalAmount = 0;
            let totalAmountAfterDiscount = 0;
            results.forEach(result => {
                const price = result.product_price;
                const discount = result.product_discount;
                const discountedPrice = price - (price * (discount / 100));
                totalAmount += result.quantity * price;
                totalAmountAfterDiscount += result.quantity * discountedPrice;
            });

            // Organize the results in the desired format
            const userCart = {
                message: "The cart is successfully checkout. Here is your order: ",
                orderDetails: {
                    items: await Promise.all(results.map(async (result) => {
                        // Fetch all image URLs for each product with the same color_code
                        const images = await new Promise((resolve, reject) => {
                            const imageQuery = 'SELECT image_url FROM images WHERE product_id = ?';
                            db.query(imageQuery, [result.product_id], (err, imageResults) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(imageResults.map(imageResult => imageResult.image_url));
                                }
                            });
                        });

                        // Combine product data with image data
                        return {
                            cart_id: result.cart_id,
                            size: result.size,
                            color: result.color,
                            color_code: result.color_code,
                            quantity: result.quantity,
                            product_id: result.product_id,
                            product_name: result.product_name,
                            product_price: result.product_price,
                            product_discount: result.product_discount,
                            images: images, // Add image URLs here
                        };
                    })),
                    totalAmount: totalAmount.toFixed(2),
                    totalAmount_after_discount: totalAmountAfterDiscount.toFixed(2),
                }
            };

            res.json(userCart);
        });
    } else {
        // User is not authorized to access this cart
        res.status(403).json({ error: "You don't have permission to access this cart" });
    }
};

const createOrder = (req, res) => {
    const user_id = req.user.user_id; // Get the authenticated user's ID from the middleware

    // Retrieve cart items for the user
    const getCartItemsQuery = `
    SELECT *, (products.price - (products.price * (discount / 100))) AS discounted_price
    FROM cart
    JOIN product_items ON cart.product_item_id = product_items.id
    JOIN products ON product_items.product_id = products.id
    WHERE user_id = ?;
    `;

    db.query(getCartItemsQuery, [user_id], (err, cartItems) => {
        if (err) {
            console.error('Error retrieving cart items:', err);
            return res.status(500).json({
                error: true,
                message: "Order creation failed",
                messages: {
                    err: "Error retrieving cart items"
                }
            });
        }

        if (cartItems.length === 0) {
            return res.status(400).json({
                error: true,
                message: "Order creation failed",
                messages: {
                    err: "No items in the cart"
                }
            });
        }

        // Calculate total amount
        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += item.quantity * item.discounted_price; // Use discounted price for calculation
        });

        // Begin transaction
        db.beginTransaction((err) => {
            if (err) {
                console.error('Error beginning transaction:', err);
                return res.status(500).json({
                    error: true,
                    message: "Order creation failed",
                    messages: {
                        err: "Error beginning transaction"
                    }
                });
            }

            // Insert order into Orders table
            const insertOrderQuery = `
                INSERT INTO Orders (user_id, total_amount)
                VALUES (?, ?);
            `;

            db.query(insertOrderQuery, [user_id, totalAmount], (err, insertResult) => {
                if (err) {
                    console.error('Error inserting order:', err);
                    return db.rollback(() => {
                        res.status(500).json({
                            error: true,
                            message: "Order creation failed",
                            messages: {
                                err: "Error inserting order"
                            }
                        });
                    });
                }

                const orderId = insertResult.insertId;

                // Insert cart items into Order_Items table
                const insertOrderItemsQuery = `
                    INSERT INTO Order_Items (order_id, product_item_id, quantity, subtotal)
                    VALUES (?, ?, ?, ?);
                `;

                const orderItemsValues = cartItems.map(item => [orderId, item.product_item_id, item.quantity, item.quantity * item.discounted_price]);

                db.query(insertOrderItemsQuery, orderItemsValues, (err, insertItemsResult) => {
                    if (err) {
                        console.error('Error inserting order items:', err);
                        return db.rollback(() => {
                            res.status(500).json({
                                error: true,
                                message: "Order creation failed",
                                messages: {
                                    err: "Error inserting order items"
                                }
                            });
                        });
                    }

                    // Delete cart items after successfully inserting into Order_Items table
                    const deleteCartItemsQuery = `
                        DELETE FROM cart
                        WHERE user_id = ?;
                    `;

                    db.query(deleteCartItemsQuery, [user_id], (err, deleteResult) => {
                        if (err) {
                            console.error('Error deleting cart items:', err);
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: true,
                                    message: "Order creation failed",
                                    messages: {
                                        err: "Error deleting cart items"
                                    }
                                });
                            });
                        }

                        // Commit the transaction if everything is successful
                        db.commit((err) => {
                            if (err) {
                                console.error('Error committing transaction:', err);
                                return db.rollback(() => {
                                    res.status(500).json({
                                        error: true,
                                        message: "Order creation failed",
                                        messages: {
                                            err: "Error committing transaction"
                                        }
                                    });
                                });
                            }

                            res.json({ message: 'Order created successfully' });
                        });
                    });
                });
            });
        });
    });
};

module.exports = {
    checkout,
    createOrder
}