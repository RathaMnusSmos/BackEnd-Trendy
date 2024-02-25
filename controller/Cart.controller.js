const db = require('../config/database/db.config')


// const addToCart = (req, res) => {
//     const { user_id, product_item_id, quantity } = req.body;

//     // Validate that the product item exists
//     const productItemQuery = 'SELECT id FROM product_items WHERE id = ?';
//     db.query(productItemQuery, [product_item_id], (err, productItemResult) => {
//         if (err) {
//             console.error('Error checking product item:', err);
//             return res.status(500).json({ error: 'Error checking product item' });
//         }

//         if (productItemResult.length === 0) {
//             return res.status(404).json({ error: 'Product item not found' });
//         }

//         // Insert the item into the cart table
//         const insertQuery = 'INSERT INTO cart (user_id, product_item_id, quantity) VALUES (?, ?, ?)';
//         db.query(insertQuery, [user_id, product_item_id, quantity], (err, result) => {
//             if (err) {
//                 console.error('Error adding item to the cart:', err);
//                 return res.status(500).json({ error: 'Error adding item to the cart' });
//             }
//             res.json({ message: 'Item added to the cart successfully' });
//         });
//     });
// };

const addToCart = (req, res) => {
    const { user_id, product_item_id, quantity } = req.body;

    // Assuming you have an authenticated user through middleware
    const authenticatedUserId = req.user.user_id; // Get the authenticated user's ID from the middleware
    // Check if the authenticated user matches the user in the request
    if (authenticatedUserId === user_id) {
        // Validate that the product item exists
        const productItemQuery = 'SELECT id, amount, pending FROM product_items WHERE id = ?';
        db.query(productItemQuery, [product_item_id], (err, productItemResult) => {
            if (err) {
                console.error('Error checking product item:', err);
                return res.status(500).json({
                    error: true,
                    message: "add fail",
                    messages: {
                        err: "Error checking product item"
                    }
                });
            }

            if (productItemResult.length === 0) {
                return res.status(404).json({
                    error: true,
                    message: "add fail",
                    messages: {
                        err: 'Product item not found'
                    }
                });
            }

            const productItem = productItemResult[0];

            // Check if there are enough items available
            if (productItem.amount < quantity) {
                return res.status(400).json({
                    error: true,
                    message: "add fail",
                    messages: {
                        err: 'Not enough items available'
                    }
                });
            }

            // Update the product item pending and amount
            const newPending = productItem.pending + quantity;

            const updateQuery = 'UPDATE product_items SET pending = ? WHERE id = ?';
            db.query(updateQuery, [newPending, product_item_id], (err, updateResult) => {
                if (err) {
                    console.error('Error updating product item:', err);
                    return res.status(500).json({
                        error: true,
                        message: "add fail",
                        messages: {
                            err: 'Error updating product item'
                        }
                    });
                }
                // You might want to add the product to the user's cart table here
                // Assuming you have a cart table and can insert the product_item_id and quantity
                const addToCartQuery = 'INSERT INTO cart (user_id, product_item_id, quantity) VALUES (?, ?, ?)';
                db.query(addToCartQuery, [user_id, product_item_id, quantity], (err, addToCartResult) => {
                    if (err) {
                        console.error('Error adding item to cart:', err);
                        return res.status(500).json({
                            error: true,
                            message: "add fail",
                            messages: {
                                err: 'Error adding item to cart'
                            }

                        });
                    }

                    res.json({ message: 'Item added to the cart successfully' });
                });
            });
        });
    } else {
        res.status(403).json({
            error: true,
            message: "add fail",
            messages: {
                err: "You don't have permission to add this item to the cart"
            }
        });
    }
};




// // Get Cart for a Specific User
// const getCartByUser = (req, res) => {
//     const userId = req.params.user_id;
//     const query = `
//         SELECT users.user_id AS user_id, users.username, users.phone, users.email, users.gender, cart.id AS cart_id, product_items.*, products.product_name, products.product_price, products.product_discount, cart.quantity
//         FROM users
//         JOIN cart ON users.user_id = cart.user_id
//         JOIN product_items ON cart.product_item_id = product_items.id
//         JOIN products ON product_items.product_id = products.id
//         WHERE cart.user_id = ?;
//     `;

//     db.query(query, [userId], (err, results) => {
//         if (err) {
//             console.error('Error fetching user cart:', err);
//             return res.status(500).json({ error: 'Error fetching user cart' });
//         }

//         // Organize the results in the desired format
//         const userCart = {
//             user: {
//                 user_id: results[0].user_id,
//                 username: results[0].username,
//                 phone: results[0].phone,
//                 email: results[0].email,
//                 gender: results[0].gender,
//                 // Add other user details here
//             },
//             cart: results.map((result) => ({
//                 cart_id: result.cart_id,
//                 size: result.size,
//                 color: result.color,
//                 color_code: result.color_code,
//                 quantity: result.quantity,
//                 product_name: result.product_name,
//                 product_price: result.product_price,
//                 product_discount: result.product_discount,
//             })),
//         };

//         res.json(userCart);
//     });
// };
const getCartByUser = (req, res) => {
    const authenticatedUserId = req.user.user_id;
    const userId = req.params.user_id;

    // Check if the authenticated user matches the user in the request
    if (authenticatedUserId == userId) {
        const query = `
            SELECT users.user_id AS user_id, users.username, users.phone, users.email, users.gender, cart.id AS cart_id, product_items.*, products.product_name, products.product_price, products.product_discount, cart.quantity
            FROM users
            JOIN cart ON users.user_id = cart.user_id
            JOIN product_items ON cart.product_item_id = product_items.id
            JOIN products ON product_items.product_id = products.id
            WHERE cart.user_id = ?;
        `;

        db.query(query, [userId], async (err, results) => {
            if (err) {
                console.error('Error fetching user cart:', err);
                return res.status(500).json({ error: 'Error fetching user cart' });
            }

            // Check if there are no results
            if (!results || results.length === 0) {
                return res.json({ message: 'User cart is empty' });
            }

            // Organize the results in the desired format
            const userCart = {
                user: {
                    user_id: results[0].user_id,
                    username: results[0].username,
                    phone: results[0].phone,
                    email: results[0].email,
                    gender: results[0].gender,
                    // Add other user details here
                },
                cart: await Promise.all(results.map(async (result) => {
                    // Fetch a single image URL for each product with the same color_code
                    const image = await new Promise((resolve, reject) => {
                        const imageQuery = 'SELECT image_url FROM images WHERE product_id = ? AND color_code = ? LIMIT 1';
                        db.query(imageQuery, [result.product_id, result.color_code], (err, imageResults) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(imageResults[0] ? imageResults[0].image_url : null);
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
                        image: image, // Include image data in the cart item
                    };
                })),
            };

            res.json(userCart);
        });
    } else {
        // User is not authorized to access this cart
        res.status(403).json({ error: "You don't have permission to access this cart" });
    }
};






// Get Cart for All Users
const getAllCarts = (req, res) => {
    const cartQuery = `
    SELECT users.user_id AS user_id, users.username, users.phone, users.email, users.gender, cart.id AS cart_id, product_items.*, products.product_name, products.product_price, products.product_discount, cart.quantity
FROM users
LEFT JOIN cart ON users.user_id = cart.user_id
LEFT JOIN product_items ON cart.product_item_id = product_items.id
LEFT JOIN products ON product_items.product_id = products.id;

`;


    db.query(cartQuery, (err, cartResults) => {
        if (err) {
            console.error('Error fetching all carts:', err);
            return res.status(500).json({ error: 'Error fetching all carts' });
        }

        const userCarts = {};

        // Organize the results by user
        cartResults.forEach((result) => {
            const userId = result.user_id;

            // If the user doesn't exist in the userCarts object, create an entry
            if (!userCarts[userId]) {
                userCarts[userId] = {
                    user: {
                        user_id: userId,
                        username: result.username,
                        phone: result.phone,
                        email: result.email,
                        gender: result.gender,
                        // Add other user details here
                    },
                    cart: [],
                };
            }

            // Push cart item to the user's cart array
            userCarts[userId].cart.push({
                cart_id: result.cart_id,
                size: result.size,
                color: result.color,
                color_code: result.color_code,
                quantity: result.quantity,
                product_name: result.product_name,
                product_price: result.product_price,
                product_discount: result.product_discount,
            });
        });

        // Convert the userCarts object into an array of user cart details
        const response = Object.values(userCarts);

        res.json(response);
    });
};



const updateCartItem = (req, res) => {
    const authenticatedUserId = req.user.user_id; // Get the authenticated user's ID from the middleware
    const userId = req.params.user_id;
    const cartId = req.params.cart_id;
    const { quantity } = req.body;

    // Check if the authenticated user matches the user in the request
    if (authenticatedUserId == userId) {
        // User is updating their own cart
        // Check if the cart item exists and is owned by the user
        const checkCartExistenceQuery = 'SELECT * FROM cart WHERE id = ? AND user_id = ?';
        db.query(checkCartExistenceQuery, [cartId, userId], (err, results) => {
            if (err) {
                console.error('Error checking cart existence:', err);
                return res.status(500).json({ error: 'Error checking cart existence' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Cart item not found' });
            }

            // Update the cart item
            const updateCartItemQuery = 'UPDATE cart SET quantity = ? WHERE id = ?';
            db.query(updateCartItemQuery, [quantity, cartId], (err, result) => {
                if (err) {
                    console.error('Error updating cart item:', err);
                    return res.status(500).json({ error: 'Error updating cart item' });
                }
                res.json({ message: 'Cart item updated successfully' });
            });
        });
    } else {
        // User is not authorized to update this cart
        res.status(403).json({ error: "You don't have permission to update this cart item" });
    }
};

// const deleteCartItem = (req, res) => {
//     const authenticatedUserId = req.user.user_id; // Get the authenticated user's ID from the middleware
//     const userId = req.params.user_id;
//     const cartId = req.params.cart_id;

//     // Check if the authenticated user matches the user in the request
//     if (authenticatedUserId == userId) {
//         // User is trying to delete their own cart item
//         // Check if the cart item exists and is owned by the user
//         const checkCartExistenceQuery = 'SELECT * FROM cart WHERE id = ? AND user_id = ?';
//         db.query(checkCartExistenceQuery, [cartId, userId], (err, results) => {
//             if (err) {
//                 console.error('Error checking cart existence:', err);
//                 return res.status(500).json({
//                     error: true,
//                     message: "delete fail",
//                     messages: {
//                         err: 'Error checking cart existence'
//                     }
//                 });
//             }
//             if (results.length === 0) {
//                 return res.status(404).json({
//                     error: true,
//                     message: "delete fail",
//                     messages: {
//                         err: 'Cart item not found'
//                     }
//                 });
//             }

//             // Delete the cart item
//             const deleteCartItemQuery = 'DELETE FROM cart WHERE id = ?';
//             db.query(deleteCartItemQuery, [cartId], (err, result) => {
//                 if (err) {
//                     console.error('Error deleting cart item:', err);
//                     return res.status(500).json({
//                         error: true,
//                         message: "delete fail",
//                         messages: {
//                             err: 'Error deleting cart item'
//                         }

//                     });
//                 }
//                 res.json({ message: 'Cart item deleted successfully' });
//             });
//         });
//     } else {
//         // User is not authorized to delete this cart item
//         res.status(403).json({
//             error: true,
//             message: "delete fail",
//             messages: {
//                 err: "You don't have permission to delete this cart item"
//             }
//         });
//     }
// };
const deleteCartItem = (req, res) => {
    const authenticatedUserId = req.user.user_id;
    const userId = req.params.user_id;
    const cartId = req.params.cart_id;

    // Check if the authenticated user matches the user in the request
    if (authenticatedUserId == userId) {
        // User is trying to delete their own cart item
        // Check if the cart item exists and is owned by the user
        const checkCartExistenceQuery = 'SELECT * FROM cart WHERE id = ? AND user_id = ?';
        db.query(checkCartExistenceQuery, [cartId, userId], (err, results) => {
            if (err) {
                console.error('Error checking cart existence:', err);
                return res.status(500).json({
                    error: true,
                    message: "delete fail",
                    messages: {
                        err: 'Error checking cart existence'
                    }
                });
            }
            if (results.length === 0) {
                return res.status(404).json({
                    error: true,
                    message: "delete fail",
                    messages: {
                        err: 'Cart item not found'
                    }
                });
            }

            // Get the product item details
            const productItemId = results[0].product_item_id;
            const quantity = results[0].quantity;

            // Delete the cart item
            const deleteCartItemQuery = 'DELETE FROM cart WHERE id = ?';
            db.query(deleteCartItemQuery, [cartId], (err, deleteResult) => {
                if (err) {
                    console.error('Error deleting cart item:', err);
                    return res.status(500).json({
                        error: true,
                        message: "delete fail",
                        messages: {
                            err: 'Error deleting cart item'
                        }
                    });
                }

                // Update the product item pending
                const updateProductItemQuery = 'UPDATE product_items SET pending = pending - ? WHERE id = ?';
                db.query(updateProductItemQuery, [quantity, productItemId], (err, updateResult) => {
                    if (err) {
                        console.error('Error updating product item:', err);
                        return res.status(500).json({
                            error: true,
                            message: "delete fail",
                            messages: {
                                err: 'Error updating product item'
                            }
                        });
                    }

                    res.json({ message: 'Cart item deleted successfully' });
                });
            });
        });
    } else {
        // User is not authorized to delete this cart item
        res.status(403).json({
            error: true,
            message: "delete fail",
            messages: {
                err: "You don't have permission to delete this cart item"
            }
        });
    }
};



// Get Cart Item by Cart ID
const getCartById = (req, res) => {
    const cartId = req.params.cart_id;
    const query = `
        SELECT cart.id AS cart_id, cart.user_id, product_items.*, products.product_name, products.product_price, products.product_discount, cart.quantity
        FROM cart
        JOIN product_items ON cart.product_item_id = product_items.id
        JOIN products ON product_items.product_id = products.id
        WHERE cart.id = ?;
    `;

    db.query(query, [cartId], (err, result) => {
        if (err) {
            console.error('Error fetching cart item:', err);
            return res.status(500).json({ error: 'Error fetching cart item' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const cartItem = {
            cart_id: result[0].cart_id,
            user_id: result[0].user_id,
            size: result[0].size,
            color: result[0].color,
            color_code: result[0].color_code,
            quantity: result[0].quantity,
            product_name: result[0].product_name,
            product_price: result[0].product_price,
            product_discount: result[0].product_discount,
        };

        res.json(cartItem);
    });
};




const deleteAllCartItems = (req, res) => {
    // Delete all cart items in the table
    const deleteAllCartItemsQuery = "DELETE FROM cart";
    db.query(deleteAllCartItemsQuery, (err, result) => {
        if (err) {
            console.error("Error deleting all cart items:", err);
            return res.status(500).json({
                error: true,
                message: "Error deleting all cart items",
                messages: {
                    err: "Error deleting all cart items!"
                }
            });

        }

        // Check if any items were deleted
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: true,
                message: "No cart items found to delete",
                messages: {
                    err: "No cart items found to delete!"
                }
            });
        }
        res.json({ message: "Bought successfully" });
    });
};


module.exports = {
    addToCart,
    getAllCarts,
    getCartByUser,
    updateCartItem,
    deleteCartItem,
    getCartById,
    deleteAllCartItems,
};
