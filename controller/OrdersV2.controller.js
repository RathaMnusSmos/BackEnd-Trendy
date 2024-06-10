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

// const placeOrder = (req, res) => {
//     const authenticatedUserId = req.user.user_id;
//     const { address_id, delivery } = req.body

//     // Check if the authenticated user matches the user in the request
//     if (authenticatedUserId) {
//         const query = `
//             SELECT cart.product_item_id, cart.quantity, product_items.*, products.product_name, products.product_price, products.product_discount
//             FROM cart
//             JOIN product_items ON cart.product_item_id = product_items.id
//             JOIN products ON product_items.product_id = products.id
//             WHERE cart.user_id = ?;
//         `;

//         db.query(query, [authenticatedUserId], async (err, results) => {
//             if (err) {
//                 console.error('Error fetching user cart:', err);
//                 return res.status(500).json({ error: 'Error fetching user cart' });
//             }

//             // Check if there are no results
//             if (!results || results.length === 0) {
//                 return res.json({ message: 'User cart is empty' });
//             }

//             // Calculate total amount and total amount after discount
//             let totalAmount = 0;
//             let totalAmountAfterDiscount = 0;
//             results.forEach(result => {
//                 const price = result.product_price;
//                 const discount = result.product_discount;
//                 const discountedPrice = price - (price * (discount / 100));
//                 totalAmount += result.quantity * price;
//                 totalAmountAfterDiscount += result.quantity * discountedPrice;
//             });

//             // Insert order details into Orders table
//             const orderQuery = 'INSERT INTO Orders (user_id, total_amount, total_amount_after_discount, address_id, status, delivery) VALUES (?, ?, ?, ?, ?, ?)';
//             const status = 'pending';
//             db.query(orderQuery, [authenticatedUserId, totalAmount.toFixed(2), totalAmountAfterDiscount.toFixed(2), address_id, status, delivery], (err, orderResult) => {
//                 if (err) {
//                     console.error('Error placing order:', err);
//                     return res.status(500).json({ error: 'Error placing order' });
//                 }

//                 const orderId = orderResult.insertId;

//                 // Insert order items into Order_Items table
//                 results.forEach(item => {
//                     const orderItemQuery = 'INSERT INTO Order_Items (order_id, product_item_id, product_id, quantity) VALUES (?, ?, ?, ?)';
//                     db.query(orderItemQuery, [orderId, item.product_item_id, item.product_id, item.quantity], (err, orderItemResult) => {
//                         if (err) {
//                             console.error('Error inserting order item:', err);
//                             return res.status(500).json({ error: 'Error inserting order item' });
//                         }
//                     });
//                 });

//                 // Clear the user's cart after placing the order
//                 const clearCartQuery = 'DELETE FROM cart WHERE user_id = ?';
//                 db.query(clearCartQuery, [authenticatedUserId], (err, clearCartResult) => {
//                     if (err) {
//                         console.error('Error clearing cart:', err);
//                         // This is not a critical error, so we won't return an error response
//                     }

//                     res.json({ message: 'Order placed successfully' });
//                 });
//             });
//         });
//     } else {
//         // User is not authenticated
//         res.status(403).json({ error: "You don't have permission to place an order" });
//     }
// };

// const placeOrder = (req, res) => {
//     const authenticatedUserId = req.user.user_id;
//     const { address_id, delivery } = req.body;

//     if (authenticatedUserId) {
//         const query = `
//             SELECT cart.product_item_id, cart.quantity, product_items.*, products.product_name, products.product_price, products.product_discount
//             FROM cart
//             JOIN product_items ON cart.product_item_id = product_items.id
//             JOIN products ON product_items.product_id = products.id
//             WHERE cart.user_id = ?;
//         `;

//         db.query(query, [authenticatedUserId], async (err, results) => {
//             if (err) {
//                 console.error('Error fetching user cart:', err);
//                 return res.status(500).json({ error: 'Error fetching user cart' });
//             }

//             if (!results || results.length === 0) {
//                 return res.json({ message: 'User cart is empty' });
//             }

//             let totalAmount = 0;
//             let totalAmountAfterDiscount = 0;
//             results.forEach(result => {
//                 const price = result.product_price;
//                 const discount = result.product_discount;
//                 const discountedPrice = price - (price * (discount / 100));
//                 totalAmount += result.quantity * price;
//                 totalAmountAfterDiscount += result.quantity * discountedPrice;
//             });

//             const orderQuery = 'INSERT INTO Orders (user_id, total_amount, total_amount_after_discount, address_id, status, delivery) VALUES (?, ?, ?, ?, ?, ?)';
//             const status = 'pending';
//             db.query(orderQuery, [authenticatedUserId, totalAmount.toFixed(2), totalAmountAfterDiscount.toFixed(2), address_id, status, delivery], (err, orderResult) => {
//                 if (err) {
//                     console.error('Error placing order:', err);
//                     return res.status(500).json({ error: 'Error placing order' });
//                 }

//                 const orderId = orderResult.insertId;

//                 results.forEach(item => {
//                     const orderItemQuery = 'INSERT INTO Order_Items (order_id, product_item_id, product_id, quantity) VALUES (?, ?, ?, ?)';
//                     db.query(orderItemQuery, [orderId, item.product_item_id, item.product_id, item.quantity], (err, orderItemResult) => {
//                         if (err) {
//                             console.error('Error inserting order item:', err);
//                             return res.status(500).json({ error: 'Error inserting order item' });
//                         }
//                     });
//                 });

//                 const clearCartQuery = 'DELETE FROM cart WHERE user_id = ?';
//                 db.query(clearCartQuery, [authenticatedUserId], (err, clearCartResult) => {
//                     if (err) {
//                         console.error('Error clearing cart:', err);
//                     }

//                     // Emit event to update client in real-time
//                     req.io.emit('orderPlaced', { orderId, userId: authenticatedUserId });

//                     res.json({ message: 'Order placed successfully' });
//                 });
//             });
//         });
//     } else {
//         res.status(403).json({ error: "You don't have permission to place an order" });
//     }
// };

const placeOrder = (req, res) => {
    const authenticatedUserId = req.user.user_id;
    const { address_id, delivery } = req.body;

    if (authenticatedUserId) {
        const query = `
            SELECT cart.product_item_id, cart.quantity, product_items.*, products.product_name, products.product_price, products.product_discount
            FROM cart
            JOIN product_items ON cart.product_item_id = product_items.id
            JOIN products ON product_items.product_id = products.id
            WHERE cart.user_id = ?;
        `;

        db.query(query, [authenticatedUserId], async (err, results) => {
            if (err) {
                console.error('Error fetching user cart:', err);
                return res.status(500).json({ error: 'Error fetching user cart' });
            }

            if (!results || results.length === 0) {
                return res.json({ message: 'User cart is empty' });
            }

            let totalAmount = 0;
            let totalAmountAfterDiscount = 0;
            results.forEach(result => {
                const price = result.product_price;
                const discount = result.product_discount;
                const discountedPrice = price - (price * (discount / 100));
                totalAmount += result.quantity * price;
                totalAmountAfterDiscount += result.quantity * discountedPrice;
            });

            // Construct order details
            const orderDetails = {
                user_id: authenticatedUserId,
                total_amount: totalAmount.toFixed(2),
                total_amount_after_discount: totalAmountAfterDiscount.toFixed(2),
                address_id: address_id,
                status: 'pending', // Initial status is 'pending'
                delivery: delivery
            };

            // Insert order into Orders table
            const orderQuery = 'INSERT INTO Orders SET ?';
            db.query(orderQuery, orderDetails, (err, orderResult) => {
                if (err) {
                    console.error('Error placing order:', err);
                    return res.status(500).json({ error: 'Error placing order' });
                }

                const orderId = orderResult.insertId;

                // Insert order items into Order_Items table
                const orderItemQuery = 'INSERT INTO Order_Items (order_id, product_item_id, product_id, quantity) VALUES ?';
                const orderItems = results.map(item => [orderId, item.product_item_id, item.product_id, item.quantity]);
                db.query(orderItemQuery, [orderItems], (err, orderItemResult) => {
                    if (err) {
                        console.error('Error inserting order items:', err);
                        return res.status(500).json({ error: 'Error inserting order items' });
                    }

                    // Clear the user's cart after placing the order
                    const clearCartQuery = 'DELETE FROM cart WHERE user_id = ?';
                    db.query(clearCartQuery, [authenticatedUserId], (err, clearCartResult) => {
                        if (err) {
                            console.error('Error clearing cart:', err);
                        }

                        // Emit event to update client in real-time
                        req.io.emit('orderPlaced', { orderId, userId: authenticatedUserId });

                        res.json({ message: 'Order placed successfully' });
                    });
                });
            });
        });
    } else {
        res.status(403).json({ error: "You don't have permission to place an order" });
    }
};



const getPendingOrders = (req, res) => {
    // Query to fetch pending orders with user details
    const query = `
        SELECT 
            orders.*, 
            users.user_id, 
            users.username, 
            users.email, 
            users.phone 
        FROM 
            orders
        JOIN 
            users ON orders.user_id = users.user_id
        WHERE 
            orders.status = 'pending';
    `;

    // Execute the query
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching pending orders:', err);
            return res.status(500).json({ error: 'Error fetching pending orders' });
        }

        // Structure the response to include both order and user details
        const response = results.map(order => ({
            order_id: order.order_id,
            user_id: order.user_id,
            user_name: order.username,
            user_email: order.email,
            user_phone: order.phone,
            address_id: order.address_id,
            total_amount: order.total_amount,
            total_amount_after_discount: order.total_amount_after_discount,
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at
        }));

        // Send the structured response to the client
        res.json(response);
    });
};

const getOrders = (req, res) => {
    // Query to fetch orders with user details, sorted by status
    const query = `
        SELECT 
            orders.*, 
            users.user_id, 
            users.username, 
            users.email, 
            users.phone 
        FROM 
            orders
        JOIN 
            users ON orders.user_id = users.user_id
        ORDER BY 
            CASE 
                WHEN orders.status = 'pending' THEN 1
                WHEN orders.status = 'cancelled' THEN 2
                WHEN orders.status = 'completed' THEN 3
                ELSE 4
            END, 
            orders.created_at DESC;
    `;

    // Execute the query
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: 'Error fetching orders' });
        }

        // Structure the response to include both order and user details
        const response = results.map(order => ({
            order_id: order.order_id,
            user_id: order.user_id,
            user_name: order.username,
            user_email: order.email,
            user_phone: order.phone,
            address_id: order.address_id,
            total_amount: order.total_amount,
            total_amount_after_discount: order.total_amount_after_discount,
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at
        }));

        // Send the structured response to the client
        res.json(response);
    });
};




const getOrderDetails = (req, res) => {
    const orderId = req.params.id; // Extract order ID from request parameters

    // console.log("orders id = " + orderId);

    // Query to fetch order details by order ID
    const orderQuery = `
        SELECT 
            orders.*, 
            order_items.quantity AS item_quantity,
            product_items.*, 
            products.product_name, 
            products.product_price, 
            products.product_discount 
        FROM 
            orders 
        JOIN 
            order_items ON orders.order_id = order_items.order_id 
        JOIN 
            product_items ON order_items.product_item_id = product_items.id 
        JOIN 
            products ON product_items.product_id = products.id 
        WHERE 
            orders.order_id = ?;
    `;

    // Execute the query to fetch order details
    db.query(orderQuery, [orderId], (err, orderResults) => {
        if (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).json({ error: 'Error fetching order details' });
        }
        console.log(orderResults)
        // If the order details are found
        if (orderResults.length > 0) {
            const userId = orderResults[0].user_id;
            const addressId = orderResults[0].address_id;
            const onDate = orderResults[0].order_at;
            const delivery_method = orderResults[0].delivery

            const totalAmount = orderResults[0].total_amount;
            const totalAmountAfterDiscount = orderResults[0].total_amount_after_discount;

            // Query to fetch user details by user ID
            const userQuery = `
                SELECT * FROM users WHERE user_id = ?;
            `;

            // Query to fetch address details by address ID and user ID
            const addressQuery = `
                SELECT * FROM addresses WHERE id = ? AND user_id = ?;
            `;

            // Execute the query to fetch user details
            db.query(userQuery, [userId], (err, userResults) => {
                if (err) {
                    console.error('Error fetching user details:', err);
                    return res.status(500).json({ error: 'Error fetching user details' });
                }

                // If the user details are found
                if (userResults.length > 0) {
                    const userDetails = userResults[0];

                    // Execute the query to fetch address details
                    db.query(addressQuery, [addressId, userId], (err, addressResults) => {
                        if (err) {
                            console.error('Error fetching address details:', err);
                            return res.status(500).json({ error: 'Error fetching address details' });
                        }

                        // If the address details are found
                        if (addressResults.length > 0) {
                            const addressDetails = addressResults[0];

                            // Get the unique product IDs from the order results
                            const productIds = [...new Set(orderResults.map(order => order.product_id))];

                            // Calculate total amount and total amount after discount

                            // orderResults.forEach(result => {
                            //     const price = result.product_price;
                            //     const discount = result.product_discount;
                            //     const discountedPrice = price - (price * (discount / 100));
                            //     totalAmount += result.quantity * price;
                            //     totalAmountAfterDiscount += result.quantity * discountedPrice;
                            // });

                            // Query to fetch product images by product IDs
                            const imagesQuery = `
                                SELECT * FROM images WHERE product_id IN (?);
                            `;

                            // Execute the query to fetch product images
                            db.query(imagesQuery, [productIds], (err, imageResults) => {
                                if (err) {
                                    console.error('Error fetching product images:', err);
                                    return res.status(500).json({ error: 'Error fetching product images' });
                                }

                                // Map product images to their respective product IDs
                                const productImages = imageResults.reduce((acc, image) => {
                                    if (!acc[image.product_id]) {
                                        acc[image.product_id] = [];
                                    }
                                    acc[image.product_id].push(image);
                                    return acc;
                                }, {});

                                // Structure the response
                                const response = {
                                    user: userDetails,
                                    address: addressDetails,
                                    onDate: onDate,
                                    delivery: delivery_method,
                                    totalAmount: totalAmount,
                                    totalAmountAfterDiscount: totalAmountAfterDiscount,
                                    items: orderResults.map(order => ({
                                        order_id: order.order_id,
                                        item_quantity: order.item_quantity,
                                        product_item_id: order.id,
                                        product_id: order.product_id,
                                        size: order.size,
                                        color: order.color,
                                        color_code: order.color_code,
                                        amount: order.amount,
                                        pending: order.pending,
                                        updated_at: order.updated_at,
                                        product_name: order.product_name,
                                        product_price: order.product_price,
                                        product_discount: order.product_discount,
                                        images: productImages[order.product_id] || []
                                    }))
                                };

                                // Send the structured response
                                res.json(response);
                            });
                        } else {
                            res.status(404).json({ message: 'Address not found' });
                        }
                    });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    });
};


// const confirmOrder = (req, res) => {
//     const orderId = req.params.orderId; // Extract order ID from request parameters

//     // SQL queries
//     const updateOrderStatusQuery = `
//         UPDATE Orders
//         SET status = 'confirmed'
//         WHERE order_id = ?;
//     `;

//     const insertOrderHistoryQuery = `
//         INSERT INTO Order_History (order_id, user_id, total_amount, order_date, shipping_address_id)
//         SELECT order_id, user_id, total_amount_after_discount, created_at, address_id
//         FROM Orders
//         WHERE order_id = ?;
//     `;

//     // Begin transaction
//     db.beginTransaction((err) => {
//         if (err) {
//             console.error('Error starting transaction:', err);
//             return res.status(500).json({ error: 'Error confirming order' });
//         }

//         // Update the order status
//         db.query(updateOrderStatusQuery, [orderId], (err, result) => {
//             if (err) {
//                 console.error('Error confirming order:', err);
//                 return db.rollback(() => {
//                     res.status(500).json({ error: 'Error confirming order' });
//                 });
//             }

//             // Check if the order was successfully updated
//             if (result.affectedRows === 0) {
//                 // No rows were affected, indicating that the order ID might be invalid
//                 return db.rollback(() => {
//                     res.status(404).json({ error: 'Order not found or already confirmed' });
//                 });
//             }

//             // Insert into order history
//             db.query(insertOrderHistoryQuery, [orderId], (err, result) => {
//                 if (err) {
//                     console.error('Error inserting order history:', err);
//                     return db.rollback(() => {
//                         res.status(500).json({ error: 'Error confirming order' });
//                     });
//                 }

//                 // Commit the transaction
//                 db.commit((err) => {
//                     if (err) {
//                         console.error('Error committing transaction:', err);
//                         return db.rollback(() => {
//                             res.status(500).json({ error: 'Error confirming order' });
//                         });
//                     }

//                     // Successfully confirmed the order and inserted into history
//                     res.status(201).json({ message: 'Order confirmed successfully' });
//                 });
//             });
//         });
//     });
// };


// const confirmOrder = (req, res) => {
//     const orderId = req.params.orderId;

//     const updateOrderStatusQuery = `
//         UPDATE Orders
//         SET status = 'confirmed'
//         WHERE order_id = ?;
//     `;

//     db.query(updateOrderStatusQuery, [orderId], (err, result) => {
//         if (err) {
//             console.error('Error confirming order:', err);
//             return res.status(500).json({ error: 'Error confirming order' });
//         }

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Order not found or already confirmed' });
//         }

//         // Emit event to update clients
//         req.io.emit('orderConfirmed', { orderId });

//         // Schedule update to 'shipping' status after 5 minutes
//         setTimeout(() => {
//             const updateToShippingQuery = `
//                 UPDATE Orders
//                 SET status = 'shipping'
//                 WHERE order_id = ?;
//             `;

//             db.query(updateToShippingQuery, [orderId], (err, result) => {
//                 if (err) {
//                     console.error('Error updating to shipping status:', err);
//                     // Handle error
//                 }

//                 // Emit event to update clients
//                 req.io.emit('orderShipping', { orderId });

//                 // Schedule completion of order after 45 minutes
//                 setTimeout(() => {
//                     const completeOrderQuery = `
//                         INSERT INTO Order_History (order_id, user_id, total_amount, order_date, shipping_address_id)
//                         SELECT order_id, user_id, total_amount_after_discount, created_at, address_id
//                         FROM Orders
//                         WHERE order_id = ?;
//                     `;

//                     db.query(completeOrderQuery, [orderId], (err, result) => {
//                         if (err) {
//                             console.error('Error completing order and inserting into order_history:', err);
//                             // Handle error
//                         }

//                         // Emit event to update clients
//                         req.io.emit('orderCompleted', { orderId });

//                         // Update status to 'completed' in the Orders table
//                         const updateToCompletedQuery = `
//                             UPDATE Orders
//                             SET status = 'completed'
//                             WHERE order_id = ?;
//                         `;
//                         db.query(updateToCompletedQuery, [orderId], (err, result) => {
//                             if (err) {
//                                 console.error('Error updating to completed status:', err);
//                                 // Handle error
//                             }
//                             const insertIntoHistoryQuery = `
//                             INSERT INTO Order_History (order_id, user_id, total_amount, order_date, shipping_address_id)
//                             SELECT order_id, user_id, total_amount_after_discount, created_at, address_id
//                             FROM Orders
//                             WHERE order_id = ?;
//                         `;

//                             db.query(insertIntoHistoryQuery, [orderId], (err, result) => {
//                                 if (err) {
//                                     console.error('Error inserting completed order into order_history:', err);
//                                     // Handle error
//                                 }
//                             });
//                         });
//                     });
//                 }, 1 * 60 * 1000); // 1 minutes
//             });
//         }, 1 * 60 * 1000); // 1 minutes
//         res.status(201).json({ message: 'Order confirmed successfully' });
//     });
// };

const confirmOrder = (req, res) => {
    const orderId = req.params.orderId;

    // Query to update order status to 'confirmed'
    const updateOrderStatusQuery = `
        UPDATE Orders
        SET status = 'confirmed'
        WHERE order_id = ?;
    `;

    // Update the order status to 'confirmed'
    db.query(updateOrderStatusQuery, [orderId], (err, result) => {
        if (err) {
            console.error('Error confirming order:', err);
            return res.status(500).json({ error: 'Error confirming order' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found or already confirmed' });
        }

        console.log(`Order ${orderId} confirmed.`);

        // Schedule the update to 'shipping' status after 5 minutes
        setTimeout(() => {
            const updateToShippingQuery = `
                UPDATE Orders
                SET status = 'shipped'
                WHERE order_id = ?;
            `;

            db.query(updateToShippingQuery, [orderId], (err, result) => {
                if (err) {
                    console.error('Error updating to shipping status:', err);
                    // Handle error
                } else {
                    console.log(`Order ${orderId} updated to shipping.`);
                }

                // Schedule the order completion after 40 minutes
                setTimeout(() => {
                    // Insert into order history
                    const completeOrderQuery = `
                        INSERT INTO Order_History (order_id, user_id, total_amount, order_date, shipping_address_id)
                        SELECT order_id, user_id, total_amount_after_discount, order_at, address_id
                        FROM Orders
                        WHERE order_id = ?;
                    `;

                    db.query(completeOrderQuery, [orderId], (err, result) => {
                        if (err) {
                            console.error('Error completing order and inserting into order_history:', err);
                            // Handle error
                        } else {
                            console.log(`Order ${orderId} inserted into order history.`);
                        }

                        // Update status to 'completed' in the Orders table
                        const updateToCompletedQuery = `
                            UPDATE Orders
                            SET status = 'completed'
                            WHERE order_id = ?;
                        `;

                        db.query(updateToCompletedQuery, [orderId], (err, result) => {
                            if (err) {
                                console.error('Error updating to completed status:', err);
                                // Handle error
                            } else {
                                console.log(`Order ${orderId} updated to completed.`);
                            }
                        });
                    });
                }, 1 * 60 * 1000); // 40 minutes
            });
        }, 1 * 60 * 1000); // 5 minutes

        // Respond to the client
        res.status(201).json({ message: 'Order confirmed successfully' });
    });
};


const getUserOrderPending = (req, res) => {
    const userId = req.user.user_id;
    const query = `SELECT * FROM Orders WHERE user_id = ? AND status = 'pending'`
    const orderQuery = `
    SELECT 
        orders.*, 
        order_items.quantity AS item_quantity,
        product_items.*, 
        products.product_name, 
        products.product_price, 
        products.product_discount 
    FROM 
        orders 
    JOIN 
        order_items ON orders.order_id = order_items.order_id 
    JOIN 
        product_items ON order_items.product_item_id = product_items.id 
    JOIN 
        products ON product_items.product_id = products.id 
    WHERE 
        orders.order_id = ?;
`;

    if (req.user.role === "user") {
        db.query(query, [userId], (error, result) => {
            if (error) {
                return res.status(500).json({ error: 'Error fetching data' });
            }

            const orderDetailsPromises = result.map(order => new Promise((resolve, reject) => {
                db.query(orderQuery, [order.order_id], (err, orderResults) => {
                    if (err) {
                        console.error('Error fetching order details:', err);
                        return reject('Error fetching order details');
                    }

                    if (orderResults.length === 0) {
                        return reject('Order not found');
                    }

                    const userId = orderResults[0].user_id;
                    const addressId = orderResults[0].address_id;
                    const onDate = orderResults[0].order_at;
                    const delivery_method = orderResults[0].delivery;
                    const totalAmount = orderResults[0].total_amount;
                    const totalAmountAfterDiscount = orderResults[0].total_amount_after_discount;

                    const userQuery = `SELECT * FROM users WHERE user_id = ?;`;
                    const addressQuery = `SELECT * FROM addresses WHERE id = ? AND user_id = ?;`;

                    db.query(userQuery, [userId], (err, userResults) => {
                        if (err) {
                            console.error('Error fetching user details:', err);
                            return reject('Error fetching user details');
                        }

                        if (userResults.length === 0) {
                            return reject('User not found');
                        }

                        const userDetails = userResults[0];

                        db.query(addressQuery, [addressId, userId], (err, addressResults) => {
                            if (err) {
                                console.error('Error fetching address details:', err);
                                return reject('Error fetching address details');
                            }

                            if (addressResults.length === 0) {
                                return reject('Address not found');
                            }

                            const addressDetails = addressResults[0];
                            const productIds = [...new Set(orderResults.map(order => order.product_id))];

                            const imagesQuery = `SELECT * FROM images WHERE product_id IN (?);`;

                            db.query(imagesQuery, [productIds], (err, imageResults) => {
                                if (err) {
                                    console.error('Error fetching product images:', err);
                                    return reject('Error fetching product images');
                                }

                                const productImages = imageResults.reduce((acc, image) => {
                                    if (!acc[image.product_id]) {
                                        acc[image.product_id] = [];
                                    }
                                    acc[image.product_id].push(image);
                                    return acc;
                                }, {});

                                const response = {
                                    orderId: order.order_id,
                                    historyId: order.history_id,
                                    address: addressDetails,
                                    onDate: onDate,
                                    confirmDate: order.order_date,
                                    delivery: delivery_method,
                                    totalAmount: totalAmount,
                                    totalAmountAfterDiscount: totalAmountAfterDiscount,
                                    items: orderResults.map(order => ({
                                        order_id: order.order_id,
                                        item_quantity: order.item_quantity,
                                        product_item_id: order.id,
                                        product_id: order.product_id,
                                        size: order.size,
                                        color: order.color,
                                        color_code: order.color_code,
                                        amount: order.amount,
                                        pending: order.pending,
                                        updated_at: order.updated_at,
                                        product_name: order.product_name,
                                        product_price: order.product_price,
                                        product_discount: order.product_discount,
                                        images: productImages[order.product_id] || []
                                    }))
                                };

                                resolve(response);
                            });
                        });
                    });
                });
            }));

            Promise.all(orderDetailsPromises)
                .then(orderDetails => res.status(200).json(orderDetails))
                .catch(error => res.status(500).json({ error }));
        });
    }
    else {
        return res.status(500).json({ error: 'This route is not allow for admin' });
    }


}

const getOrderHistoryByUserAuth = (req, res) => {
    const userId = req.user.user_id;

    const query = `SELECT * FROM Order_History WHERE user_id = ?`;

    const orderQuery = `
        SELECT 
            orders.*, 
            order_items.quantity AS item_quantity,
            product_items.*, 
            products.product_name, 
            products.product_price, 
            products.product_discount 
        FROM 
            orders 
        JOIN 
            order_items ON orders.order_id = order_items.order_id 
        JOIN 
            product_items ON order_items.product_item_id = product_items.id 
        JOIN 
            products ON product_items.product_id = products.id 
        WHERE 
            orders.order_id = ?;
    `;

    if (req.user.role !== "user") {
        return res.status(403).json({ error: 'This route is not allowed for admin' });
    }

    db.query(query, [userId], (error, result) => {
        if (error) {
            return res.status(500).json({ error: 'Error fetching data' });
        }

        const orderDetailsPromises = result.map(order => new Promise((resolve, reject) => {
            db.query(orderQuery, [order.order_id], (err, orderResults) => {
                if (err) {
                    console.error('Error fetching order details:', err);
                    return reject('Error fetching order details');
                }

                if (orderResults.length === 0) {
                    return reject('Order not found');
                }

                const userId = orderResults[0].user_id;
                const addressId = orderResults[0].address_id;
                const onDate = orderResults[0].order_at;
                const delivery_method = orderResults[0].delivery;
                const totalAmount = orderResults[0].total_amount;
                const totalAmountAfterDiscount = orderResults[0].total_amount_after_discount;
                const status = orderResults[0].status

                const userQuery = `SELECT * FROM users WHERE user_id = ?;`;
                const addressQuery = `SELECT * FROM addresses WHERE id = ? AND user_id = ?;`;

                db.query(userQuery, [userId], (err, userResults) => {
                    if (err) {
                        console.error('Error fetching user details:', err);
                        return reject('Error fetching user details');
                    }

                    if (userResults.length === 0) {
                        return reject('User not found');
                    }

                    const userDetails = userResults[0];

                    db.query(addressQuery, [addressId, userId], (err, addressResults) => {
                        if (err) {
                            console.error('Error fetching address details:', err);
                            return reject('Error fetching address details');
                        }

                        if (addressResults.length === 0) {
                            return reject('Address not found');
                        }

                        const addressDetails = addressResults[0];
                        const productIds = [...new Set(orderResults.map(order => order.product_id))];

                        const imagesQuery = `SELECT * FROM images WHERE product_id IN (?);`;

                        db.query(imagesQuery, [productIds], (err, imageResults) => {
                            if (err) {
                                console.error('Error fetching product images:', err);
                                return reject('Error fetching product images');
                            }

                            const productImages = imageResults.reduce((acc, image) => {
                                if (!acc[image.product_id]) {
                                    acc[image.product_id] = [];
                                }
                                acc[image.product_id].push(image);
                                return acc;
                            }, {});

                            const response = {
                                orderId: order.order_id,
                                historyId: order.history_id,
                                address: addressDetails,
                                onDate: onDate,
                                status: status,
                                confirmDate: order.order_date,
                                delivery: delivery_method,
                                totalAmount: totalAmount,
                                totalAmountAfterDiscount: totalAmountAfterDiscount,
                                items: orderResults.map(order => ({
                                    order_id: order.order_id,
                                    item_quantity: order.item_quantity,
                                    product_item_id: order.id,
                                    product_id: order.product_id,
                                    size: order.size,
                                    color: order.color,
                                    color_code: order.color_code,
                                    amount: order.amount,
                                    pending: order.pending,
                                    updated_at: order.updated_at,
                                    product_name: order.product_name,
                                    product_price: order.product_price,
                                    product_discount: order.product_discount,
                                    images: productImages[order.product_id] || []
                                }))
                            };

                            resolve(response);
                        });
                    });
                });
            });
        }));

        Promise.all(orderDetailsPromises)
            .then(orderDetails => res.status(200).json(orderDetails))
            .catch(error => res.status(500).json({ error }));
    });
};

const getUserOrders = (req, res) => {
    const userId = req.user.user_id;
    const query = `
        SELECT * FROM Orders
        WHERE user_id = ? AND status IN ('pending', 'confirmed', 'shipped')
    `;
    const orderQuery = `
        SELECT 
            orders.*, 
            order_items.quantity AS item_quantity,
            product_items.*, 
            products.product_name, 
            products.product_price, 
            products.product_discount 
        FROM 
            orders 
        JOIN 
            order_items ON orders.order_id = order_items.order_id 
        JOIN 
            product_items ON order_items.product_item_id = product_items.id 
        JOIN 
            products ON product_items.product_id = products.id 
        WHERE 
            orders.order_id = ?;
    `;

    if (req.user.role === "user") {
        db.query(query, [userId], (error, result) => {
            if (error) {
                return res.status(500).json({ error: 'Error fetching data' });
            }

            // orderDate = result.created_at
            // console.log(result)
            const orderDetailsPromises = result.map(order => new Promise((resolve, reject) => {
                db.query(orderQuery, [order.order_id], (err, orderResults) => {
                    if (err) {
                        console.error('Error fetching order details:', err);
                        return reject('Error fetching order details');
                    }

                    // Remaining code remains the same as before...
                    if (orderResults.length === 0) {
                        return reject('Order not found');
                    }

                   

                    const userId = orderResults[0].user_id;
                    const addressId = orderResults[0].address_id;
                    const onDate = order.order_at;
                    const delivery_method = orderResults[0].delivery;
                    const totalAmount = orderResults[0].total_amount;
                    const totalAmountAfterDiscount = orderResults[0].total_amount_after_discount;

                    const userQuery = `SELECT * FROM users WHERE user_id = ?;`;
                    const addressQuery = `SELECT * FROM addresses WHERE id = ? AND user_id = ?;`;

                    db.query(userQuery, [userId], (err, userResults) => {
                        if (err) {
                            console.error('Error fetching user details:', err);
                            return reject('Error fetching user details');
                        }

                        if (userResults.length === 0) {
                            return reject('User not found');
                        }

                        const userDetails = userResults[0];

                        db.query(addressQuery, [addressId, userId], (err, addressResults) => {
                            if (err) {
                                console.error('Error fetching address details:', err);
                                return reject('Error fetching address details');
                            }

                            if (addressResults.length === 0) {
                                return reject('Address not found');
                            }

                            const addressDetails = addressResults[0];
                            const productIds = [...new Set(orderResults.map(order => order.product_id))];

                            const imagesQuery = `SELECT * FROM images WHERE product_id IN (?);`;

                            db.query(imagesQuery, [productIds], (err, imageResults) => {
                                if (err) {
                                    console.error('Error fetching product images:', err);
                                    return reject('Error fetching product images');
                                }

                                const productImages = imageResults.reduce((acc, image) => {
                                    if (!acc[image.product_id]) {
                                        acc[image.product_id] = [];
                                    }
                                    acc[image.product_id].push(image);
                                    return acc;
                                }, {});
                                const response = {
                                    orderId: order.order_id,
                                    status: order.status,
                                    historyId: order.history_id,
                                    address: addressDetails,
                                    onDate: onDate,
                                    confirmDate: order.order_date,
                                    delivery: delivery_method,
                                    totalAmount: totalAmount,
                                    totalAmountAfterDiscount: totalAmountAfterDiscount,
                                    items: orderResults.map(order => ({
                                        order_id: order.order_id,
                                        item_quantity: order.item_quantity,
                                        product_item_id: order.id,
                                        product_id: order.product_id,
                                        size: order.size,
                                        color: order.color,
                                        color_code: order.color_code,
                                        amount: order.amount,
                                        pending: order.pending,
                                        updated_at: order.updated_at,
                                        product_name: order.product_name,
                                        product_price: order.product_price,
                                        product_discount: order.product_discount,
                                        images: productImages[order.product_id] || []
                                    }))
                                };

                                resolve(response);
                            });
                        });
                    });
                });
            }));

            Promise.all(orderDetailsPromises)
                .then(orderDetails => res.status(200).json(orderDetails))
                .catch(error => res.status(500).json({ error }));
        });
    } else {
        return res.status(500).json({ error: 'This route is not allowed for admin' });
    }
}



module.exports = {
    checkout,
    placeOrder,
    getPendingOrders,
    getOrderDetails,
    confirmOrder,
    getOrders,
    getUserOrderPending,
    getOrderHistoryByUserAuth,
    getUserOrders
}