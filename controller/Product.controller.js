const db = require('../config/database/db.config')
// Product Controllers
const createProduct = (req, res) => {
    const { category_id, product_name, product_price, product_discount, product_description } = req.body;

    // Add validation for required fields
    if (!category_id || !product_name || !product_price) {
        return res.status(400).json({ error: 'Category ID, product name, and product price are required' });
    }

    const query = 'INSERT INTO products (category_id, product_name, product_price, product_discount, description) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [category_id, product_name, product_price, product_discount, product_description], (err, result) => {
        if (err) {
            console.error('Error creating product:', err);
            return res.status(500).json({ error: 'Error creating product' });
        }

        // Check if the product was successfully created
        if (result.affectedRows === 1) {
            res.status(201).json({ message: 'Product created', productId: result.insertId });
        } else {
            res.status(500).json({ error: 'Failed to create the product' });
        }
    });
};


const getProductsBySubcategory = (req, res) => {
    const subcategory_id = req.params.subcategory_id;
    const query = 'SELECT * FROM products WHERE category_id = ?';
    db.query(query, [subcategory_id], (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Error fetching products' });
        }
        res.json(results);
    });
};


const updateProduct = (req, res) => {
    const productId = req.params.id;
    const { product_name, product_price, product_discount, product_description } = req.body;

    // Add validation for required fields
    if (!product_name || !product_price) {
        return res.status(400).json({ error: 'Product name and product price are required' });
    }

    const query = 'UPDATE products SET product_name = ?, product_price = ?, product_discount = ?, description = ? WHERE id = ?';
    db.query(query, [product_name, product_price, product_discount, productId], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ error: 'Error updating product' });
        }

        // Check if the product was found and updated
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated' });
    });
};

const deleteProduct = (req, res) => {
    const productId = req.params.id;
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: 'Error deleting product' });
        }

        // Check if the product was found and deleted
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    });
};

const getAllProducts = (req, res) => {
    const productsQuery = 'SELECT products.*, SUM(product_items.amount) AS total_amount FROM products LEFT JOIN product_items ON products.id = product_items.product_id GROUP BY products.id';
    const itemsQuery = 'SELECT size, color, color_code, amount, id, product_id FROM product_items';
    const imagesQuery = 'SELECT image_url, image_onColor, color, color_code, public_id, id, product_id FROM images';

    db.query(productsQuery, (err, productsResults) => {
        if (err) {
            console.error('Error fetching all products:', err);
            return res.status(500).json({ error: 'Error fetching products' });
        }

        const productMap = new Map();

        // Iterate through product results and organize the data
        productsResults.forEach((product) => {
            productMap.set(product.id, {
                id: product.id,
                category_id: product.category_id,
                product_name: product.product_name,
                product_price: product.product_price,
                product_discount: product.product_discount,
                amount: product.total_amount, // Set the amount from the SUM query
                available_size: [],
                available_color: [],
                items: [],
                image: []
            });
        });

        db.query(itemsQuery, (err, itemsResults) => {
            if (err) {
                console.error('Error fetching product items:', err);
                return res.status(500).json({ error: 'Error fetching product items' });
            }

            // Iterate through item results and populate the product data
            itemsResults.forEach((item) => {
                const sizeColorKey = `${item.size}_${item.color}`;
                if (productMap.has(item.product_id)) {
                    const productData = productMap.get(item.product_id);
                    const size = {
                        size: item.size,
                        amount: item.amount,
                        color_onSize: [
                            {
                                color: item.color,
                                color_code: item.color_code,
                                amount: item.amount,
                            },
                        ],
                    };
                    const color = {
                        color: item.color,
                        color_code: item.color_code,
                        amount: item.amount,
                    };
                    const itemData = {
                        item_id: item.id,
                        color: item.color,
                        color_code: item.color_code,
                        size: item.size,
                        amount: item.amount,
                    };

                    productData.available_size.push(size);
                    productData.available_color.push(color);
                    productData.items.push(itemData);
                }
            });

            db.query(imagesQuery, (err, imageResults) => {
                if (err) {
                    console.error('Error fetching product images:', err);
                    return res.status(500).json({ error: 'Error fetching product images' });
                }

                // Iterate through image results and populate the image data
                imageResults.forEach((image) => {
                    if (productMap.has(image.product_id)) {
                        const productData = productMap.get(image.product_id);
                        const imageInfo = {
                            image_id: image.id,
                            image_url: image.image_url,
                            image_onColor: image.image_onColor,
                            color: image.color,
                            color_code: image.color_code,
                            public_id: image.public_id,
                        };
                        productData.image.push(imageInfo);
                    }
                });

                // Send the JSON-like data as a response
                const formattedProducts = Array.from(productMap.values());
                res.json(formattedProducts);
            });
        });
    });
};

// const getAllProductsV2 = (req, res) => {
//     const filters = {
//         size: req.query.size,
//         price: req.query.price,
//         category: req.query.category,
//         color: req.query.color,
//         query: req.query.query, // Add a query parameter for searching
//     };

//     const page = req.query.page || 1;
//     const limit = req.query.limit || 10;

//     let productsQuery = `
//         SELECT p.*, c.name AS category_name, SUM(pi.amount) AS total_amount
//         FROM products AS p
//         LEFT JOIN Category AS c ON p.category_id = c.id
//         LEFT JOIN product_items AS pi ON p.id = pi.product_id
//     `;

//     const whereConditions = [];
//     if (filters.size) {
//         whereConditions.push(`pi.size = '${filters.size}'`);
//     }
//     if (filters.price) {
//         whereConditions.push(`p.product_price <= ${filters.price}`);
//     }
//     if (filters.category) {
//         whereConditions.push(`p.category_id = ${filters.category}`);
//     }
//     if (filters.color) {
//         whereConditions.push(`pi.color = '${filters.color}'`);
//     }
//     if (filters.query) {
//         whereConditions.push(`p.product_name LIKE '%${filters.query}%'`); // Add searching by product name
//     }

//     if (whereConditions.length > 0) {
//         productsQuery += ' WHERE ' + whereConditions.join(' AND ');
//     }

//     productsQuery += ' GROUP BY p.id';
//     productsQuery += ' ORDER BY p.id';

//     productsQuery += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

//     db.query(productsQuery, (err, productsResults) => {
//         if (err) {
//             console.error('Error fetching filtered products:', err);
//             return res.status(500).json({ error: 'Error fetching filtered products' });
//         }

//         const productPromises = productsResults.map(product => {
//             return new Promise((resolve, reject) => {
//                 const productDetailsQuery = `
//                     SELECT DISTINCT id, size, color, color_code, amount
//                     FROM product_items
//                     WHERE product_id = ${product.id}
//                 `;

//                 db.query(productDetailsQuery, (err, productDetailsResults) => {
//                     if (err) {
//                         console.error('Error fetching product details:', err);
//                         reject(err);
//                     } else {
//                         const productDetails = {
//                             id: product.id,
//                             category_id: product.category_id,
//                             product_name: product.product_name,
//                             product_price: product.product_price,
//                             product_discount: product.product_discount,
//                             description: product.description,
//                             amount: product.total_amount || null,
//                             available_size: [],
//                             available_color: [],
//                             items: [],
//                             image: [],
//                         };

//                         productDetailsResults.forEach(detail => {
//                             const sizeColorKey = `${detail.size}_${detail.color}`;
//                             const sizeExists = productDetails.available_size.find(s => s.size === detail.size);
//                             const colorExists = productDetails.available_color.find(c => c.color === detail.color);

//                             if (!sizeExists) {
//                                 productDetails.available_size.push({
//                                     size: detail.size,
//                                     amount: 0,
//                                     color_onSize: [],
//                                 });
//                             }

//                             if (!colorExists) {
//                                 productDetails.available_color.push({
//                                     color: detail.color,
//                                     color_code: detail.color_code,
//                                     amount: 0,
//                                 });
//                             }

//                             productDetails.available_size.forEach(s => {
//                                 if (s.size === detail.size) {
//                                     s.amount += detail.amount;
//                                     s.color_onSize.push({
//                                         color: detail.color,
//                                         color_code: detail.color_code,
//                                         amount: detail.amount,
//                                     });
//                                 }
//                             });

//                             productDetails.available_color.forEach(c => {
//                                 if (c.color === detail.color) {
//                                     c.amount += detail.amount;
//                                 }
//                             });
                            
//                             const itemData = {
//                                 item_id: detail.id,
//                                 color: detail.color,
//                                 color_code: detail.color_code,
//                                 size: detail.size,
//                                 amount: detail.amount,
//                             };

//                             productDetails.items.push(itemData);
//                         });

//                         resolve(productDetails);
//                     }
//                 });
//             });
//         });

//         Promise.all(productPromises)
//             .then(productsWithDetails => {
//                 // Fetch images for each product
//                 const productWithImagesPromises = productsWithDetails.map(product => {
//                     return new Promise((resolve, reject) => {
//                         const imagesQuery = `
//                             SELECT image_url, image_onColor, color, color_code, public_id, id, product_id
//                             FROM images
//                             WHERE product_id = ${product.id}
//                         `;

//                         db.query(imagesQuery, (err, imageResults) => {
//                             if (err) {
//                                 console.error('Error fetching product images:', err);
//                                 reject(err);
//                             } else {
//                                 const images = imageResults.map(image => ({
//                                     image_id: image.id,
//                                     image_url: image.image_url,
//                                     image_onColor: image.image_onColor,
//                                     color: image.color,
//                                     color_code: image.color_code,
//                                     public_id: image.public_id,
//                                 }));

//                                 product.image = images;
//                                 resolve(product);
//                             }
//                         });
//                     });
//                 });

//                 Promise.all(productWithImagesPromises)
//                     .then(productsWithImages => {
//                         // Send the JSON response with products and details
//                         res.json(productsWithImages);
//                     })
//                     .catch(error => {
//                         console.error('Error fetching product images:', error);
//                         res.status(500).json({ error: 'Error fetching product images' });
//                     });
//             })
//             .catch(error => {
//                 console.error('Error fetching product details:', error);
//                 res.status(500).json({ error: 'Error fetching product details' });
//             });
//     });
// };

// const getAllProductsV2 = (req, res) => {
//     const filters = {
//         size: req.query.size,
//         price: req.query.price,
//         category: req.query.category,
//         color: req.query.color,
//         query: req.query.query,
//     };

//     const page = req.query.page || 1;
//     const limit = req.query.limit || 10;
//     const sortBy = req.query.sortBy || 'id'; // Default sorting by product id
//     const sortOrder = req.query.sortOrder || 'asc';

//     let productsQuery = `
//         SELECT p.*, c.name AS category_name, SUM(pi.amount) AS total_amount
//         FROM products AS p
//         LEFT JOIN Category AS c ON p.category_id = c.id
//         LEFT JOIN product_items AS pi ON p.id = pi.product_id
//     `;

//     const whereConditions = [];
//     if (filters.size) {
//         whereConditions.push(`pi.size = '${filters.size}'`);
//     }
//     if (filters.price) {
//         whereConditions.push(`p.product_price <= ${filters.price}`);
//     }
//     if (filters.category) {
//         whereConditions.push(`p.category_id = ${filters.category}`);
//     }
//     if (filters.color) {
//         whereConditions.push(`pi.color = '${filters.color}'`);
//     }
//     if (filters.query) {
//         whereConditions.push(`p.product_name LIKE '%${filters.query}%'`);
//     }

//     if (whereConditions.length > 0) {
//         productsQuery += ' WHERE ' + whereConditions.join(' AND ');
//     }

//     productsQuery += ` GROUP BY p.id`;
//     productsQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
//     productsQuery += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

//     db.query(productsQuery, (err, productsResults) => {
//         if (err) {
//             console.error('Error fetching filtered products:', err);
//             return res.status(500).json({ error: 'Error fetching filtered products' });
//         }

//         const productPromises = productsResults.map(product => {
//             return new Promise((resolve, reject) => {
//                 const productDetailsQuery = `
//                     SELECT DISTINCT id, size, color, color_code, amount
//                     FROM product_items
//                     WHERE product_id = ${product.id}
//                 `;

//                 db.query(productDetailsQuery, (err, productDetailsResults) => {
//                     if (err) {
//                         console.error('Error fetching product details:', err);
//                         reject(err);
//                     } else {
//                         const productDetails = {
//                             id: product.id,
//                             category_id: product.category_id,
//                             product_name: product.product_name,
//                             product_price: product.product_price,
//                             product_discount: product.product_discount,
//                             description: product.description,
//                             amount: product.total_amount || null,
//                             available_size: [],
//                             available_color: [],
//                             items: [],
//                             image: [],
//                         };

//                         productDetailsResults.forEach(detail => {
//                             const sizeColorKey = `${detail.size}_${detail.color}`;
//                             const sizeExists = productDetails.available_size.find(s => s.size === detail.size);
//                             const colorExists = productDetails.available_color.find(c => c.color === detail.color);

//                             if (!sizeExists) {
//                                 productDetails.available_size.push({
//                                     size: detail.size,
//                                     amount: 0,
//                                     color_onSize: [],
//                                 });
//                             }

//                             if (!colorExists) {
//                                 productDetails.available_color.push({
//                                     color: detail.color,
//                                     color_code: detail.color_code,
//                                     amount: 0,
//                                 });
//                             }

//                             productDetails.available_size.forEach(s => {
//                                 if (s.size === detail.size) {
//                                     s.amount += detail.amount;
//                                     s.color_onSize.push({
//                                         color: detail.color,
//                                         color_code: detail.color_code,
//                                         amount: detail.amount,
//                                     });
//                                 }
//                             });

//                             productDetails.available_color.forEach(c => {
//                                 if (c.color === detail.color) {
//                                     c.amount += detail.amount;
//                                 }
//                             });

//                             const itemData = {
//                                 item_id: detail.id,
//                                 color: detail.color,
//                                 color_code: detail.color_code,
//                                 size: detail.size,
//                                 amount: detail.amount,
//                             };

//                             productDetails.items.push(itemData);
//                         });

//                         resolve(productDetails);
//                     }
//                 });
//             });
//         });

//         Promise.all(productPromises)
//             .then(productsWithDetails => {
//                 const productWithImagesPromises = productsWithDetails.map(product => {
//                     return new Promise((resolve, reject) => {
//                         const imagesQuery = `
//                             SELECT image_url, image_onColor, color, color_code, public_id, id, product_id
//                             FROM images
//                             WHERE product_id = ${product.id}
//                         `;

//                         db.query(imagesQuery, (err, imageResults) => {
//                             if (err) {
//                                 console.error('Error fetching product images:', err);
//                                 reject(err);
//                             } else {
//                                 const images = imageResults.map(image => ({
//                                     image_id: image.id,
//                                     image_url: image.image_url,
//                                     image_onColor: image.image_onColor,
//                                     color: image.color,
//                                     color_code: image.color_code,
//                                     public_id: image.public_id,
//                                 }));

//                                 product.image = images;
//                                 resolve(product);
//                             }
//                         });
//                     });
//                 });

//                 Promise.all(productWithImagesPromises)
//                     .then(productsWithImages => {
//                         res.json(productsWithImages);
//                     })
//                     .catch(error => {
//                         console.error('Error fetching product images:', error);
//                         res.status(500).json({ error: 'Error fetching product images' });
//                     });
//             })
//             .catch(error => {
//                 console.error('Error fetching product details:', error);
//                 res.status(500).json({ error: 'Error fetching product details' });
//             });
//     });
// };


const getAllProductsV2 = (req, res) => {
    const filters = {
        size: req.query.size,
        price: req.query.price,
        category: req.query.category,
        color: req.query.color,
        query: req.query.query,
    };

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let productsQuery = `
        SELECT p.*, c.name AS category_name, total_amount.total_amount
        FROM products AS p
        LEFT JOIN Category AS c ON p.category_id = c.id
        LEFT JOIN (
            SELECT product_id, SUM(amount) AS total_amount
            FROM product_items
            GROUP BY product_id
        ) AS total_amount ON p.id = total_amount.product_id
    `;

    const whereConditions = [];
    if (filters.size) {
        whereConditions.push(`pi.size = '${filters.size}'`);
    }
    if (filters.price) {
        whereConditions.push(`p.product_price <= ${filters.price}`);
    }
    if (filters.category) {
        whereConditions.push(`p.category_id = ${filters.category}`);
    }
    if (filters.color) {
        whereConditions.push(`pi.color = '${filters.color}'`);
    }
    if (filters.query) {
        whereConditions.push(`p.product_name LIKE '%${filters.query}%'`);
    }

    if (whereConditions.length > 0) {
        productsQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    productsQuery += ' GROUP BY p.id';

    const validSortFields = ['id', 'product_price', 'product_discount', 'total_amount'];
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder || 'asc';

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';

    // If sorting by amount, use the total amount from product_items
    const orderByClause = sortBy === 'amount' ? 'total_amount' : sortField;

    productsQuery += ` ORDER BY ${orderByClause} ${sortOrder}`;
    productsQuery += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    db.query(productsQuery, (err, productsResults) => {
        if (err) {
            console.error('Error fetching filtered products:', err);
            return res.status(500).json({ error: 'Error fetching filtered products' });
        }

        const productPromises = productsResults.map(product => {
            return new Promise((resolve, reject) => {
                const productDetailsQuery = `
                    SELECT DISTINCT id, size, color, color_code, amount
                    FROM product_items
                    WHERE product_id = ${product.id}
                `;

                db.query(productDetailsQuery, (err, productDetailsResults) => {
                    if (err) {
                        console.error('Error fetching product details:', err);
                        reject(err);
                    } else {
                        const productDetails = {
                            id: product.id,
                            category_id: product.category_id,
                            product_name: product.product_name,
                            product_price: product.product_price,
                            product_discount: product.product_discount,
                            description: product.description,
                            amount: product.total_amount || null,
                            available_size: [],
                            available_color: [],
                            items: [],
                            image: [],
                        };

                        productDetailsResults.forEach(detail => {
                            const sizeColorKey = `${detail.size}_${detail.color}`;
                            const sizeExists = productDetails.available_size.find(s => s.size === detail.size);
                            const colorExists = productDetails.available_color.find(c => c.color === detail.color);

                            if (!sizeExists) {
                                productDetails.available_size.push({
                                    size: detail.size,
                                    amount: 0,
                                    color_onSize: [],
                                });
                            }

                            if (!colorExists) {
                                productDetails.available_color.push({
                                    color: detail.color,
                                    color_code: detail.color_code,
                                    amount: 0,
                                });
                            }

                            productDetails.available_size.forEach(s => {
                                if (s.size === detail.size) {
                                    s.amount += detail.amount;
                                    s.color_onSize.push({
                                        color: detail.color,
                                        color_code: detail.color_code,
                                        amount: detail.amount,
                                    });
                                }
                            });

                            productDetails.available_color.forEach(c => {
                                if (c.color === detail.color) {
                                    c.amount += detail.amount;
                                }
                            });

                            const itemData = {
                                item_id: detail.id,
                                color: detail.color,
                                color_code: detail.color_code,
                                size: detail.size,
                                amount: detail.amount,
                            };

                            productDetails.items.push(itemData);
                        });

                        resolve(productDetails);
                    }
                });
            });
        });

        Promise.all(productPromises)
            .then(productsWithDetails => {
                const productWithImagesPromises = productsWithDetails.map(product => {
                    return new Promise((resolve, reject) => {
                        const imagesQuery = `
                            SELECT image_url, image_onColor, color, color_code, public_id, id, product_id
                            FROM images
                            WHERE product_id = ${product.id}
                        `;

                        db.query(imagesQuery, (err, imageResults) => {
                            if (err) {
                                console.error('Error fetching product images:', err);
                                reject(err);
                            } else {
                                const images = imageResults.map(image => ({
                                    image_id: image.id,
                                    image_url: image.image_url,
                                    image_onColor: image.image_onColor,
                                    color: image.color,
                                    color_code: image.color_code,
                                    public_id: image.public_id,
                                }));

                                product.image = images;
                                resolve(product);
                            }
                        });
                    });
                });

                Promise.all(productWithImagesPromises)
                    .then(productsWithImages => {
                        res.json(productsWithImages);
                    })
                    .catch(error => {
                        console.error('Error fetching product images:', error);
                        res.status(500).json({ error: 'Error fetching product images' });
                    });
            })
            .catch(error => {
                console.error('Error fetching product details:', error);
                res.status(500).json({ error: 'Error fetching product details' });
            });
    });
};





const getOneProduct = (req, res) => {
    const productId = req.params.id;
    const productQuery = 'SELECT products.*, SUM(product_items.amount) AS total_amount FROM products LEFT JOIN product_items ON products.id = product_items.product_id WHERE products.id = ? GROUP BY products.id';
    const itemsQuery = 'SELECT size, color, color_code, amount, id FROM product_items WHERE product_id = ?';
    const imageQuery = 'SELECT image_url, image_onColor, color, color_code, public_id, id FROM images WHERE product_id = ?';

    db.query(productQuery, [productId], (err, productResults) => {
        if (err) {
            console.error('Error fetching product details:', err);
            return res.status(500).json({ error: 'Error fetching product' });
        }
        if (productResults.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Create a structure to hold the JSON-like data
        const result = {
            id: productResults[0].id,
            category_id: productResults[0].category_id,
            product_name: productResults[0].product_name,
            product_price: productResults[0].product_price,
            product_discount: productResults[0].product_discount,
            product_description: productResults[0].description,
            amount: productResults[0].total_amount, // Set the amount from the SUM query
            available_size: [],
            available_color: [],
            items: [],
            image: [] // Initialize the image array

        };

        db.query(itemsQuery, [productId], (err, itemsResults) => {
            if (err) {
                console.error('Error fetching product items:', err);
                return res.status(500).json({ error: 'Error fetching product items' });
            }

            // Iterate through the item results and populate the JSON structure
            itemsResults.forEach((item) => {
                const size = {
                    size: item.size,
                    amount: item.amount,
                    color_onSize: [
                        {
                            color: item.color,
                            color_code: item.color_code,
                            amount: item.amount,
                        },
                    ],
                };
                const color = {
                    color: item.color,
                    color_code: item.color_code,
                    amount: item.amount,
                };
                const itemData = {
                    item_id: item.id,
                    color: item.color,
                    color_code: item.color_code,
                    size: item.size,
                    amount: item.amount,
                };

                result.available_size.push(size);
                result.available_color.push(color);
                result.items.push(itemData);
            });

            db.query(imageQuery, [productId], (err, imageResults) => {
                if (err) {
                    console.error('Error fetching product images:', err);
                    return res.status(500).json({ error: 'Error fetching product images' });
                }

                // Iterate through the image results and populate the image array
                imageResults.forEach((image) => {
                    const imageInfo = {
                        image_id: image.id,
                        image_url: image.image_url,
                        image_onColor: image.image_onColor,
                        color: image.color,
                        color_code: image.color_code,
                        public_id: image.public_id,
                    };
                    result.image.push(imageInfo);
                });

                // Send the JSON-like data as a response
                res.json(result);
            });
        });
    });
};


const getProductsWithCategories = (req, res) => {
    const query = `
        SELECT 
            p.*,
            c_sub.name AS subcategory,
            c_top.name AS category
        FROM products p
        LEFT JOIN Category c_sub ON p.category_id = c_sub.id
        LEFT JOIN Category c_top ON c_sub.parent_id = c_top.id;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products with categories:', err);
            return res.status(500).json({ error: 'Error fetching products' });
        }

        // Organize the data into the desired structure
        const structuredData = [];

        results.forEach((row) => {
            const categoryIndex = structuredData.findIndex((item) => item.category === row.category);
            if (categoryIndex === -1) {
                const newCategory = {
                    category: row.category,
                    subcategories: [],
                };
                newCategory.subcategories.push({
                    subcategory: row.subcategory,
                    products: [row],
                });
                structuredData.push(newCategory);
            } else {
                const subcategoryIndex = structuredData[categoryIndex].subcategories.findIndex(
                    (item) => item.subcategory === row.subcategory
                );
                if (subcategoryIndex === -1) {
                    structuredData[categoryIndex].subcategories.push({
                        subcategory: row.subcategory,
                        products: [row],
                    });
                } else {
                    structuredData[categoryIndex].subcategories[subcategoryIndex].products.push(row);
                }
            }
        });

        res.json(structuredData);
    });
};
const getProductsBySubcategoryWithFullDetail = (req, res) => {
    const subcategory_id = req.params.subcategory_id;
    const productQuery = 'SELECT products.*, SUM(product_items.amount) AS total_amount FROM products LEFT JOIN product_items ON products.id = product_items.product_id WHERE products.category_id = ? GROUP BY products.id';
    const itemsQuery = 'SELECT size, color, color_code, amount, id FROM product_items WHERE product_id = ?';
    const imageQuery = 'SELECT image_url, image_onColor, color, color_code, id FROM images WHERE product_id = ?';

    db.query(productQuery, [subcategory_id], (err, productResults) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Error fetching products' });
        }

        const productsWithFullDetail = [];

        const fetchProductDetails = (index) => {
            if (index < productResults.length) {
                const product = productResults[index];
                const result = {
                    id: product.id,
                    category_id: product.category_id,
                    product_name: product.product_name,
                    product_price: product.product_price,
                    product_discount: product.product_discount,
                    description: product.description,
                    amount: product.total_amount, // Set the amount from the SUM query
                    available_size: [],
                    available_color: [],
                    items: [],
                    image: [] // Initialize the image array

                };

                db.query(itemsQuery, [product.id], (err, itemsResults) => {
                    if (err) {
                        console.error('Error fetching product items:', err);
                        return res.status(500).json({ error: 'Error fetching product items' });
                    }

                    // Iterate through the item results and populate the JSON structure
                    itemsResults.forEach((item) => {
                        const size = {
                            size: item.size,
                            amount: item.amount,
                            color_onSize: [
                                {
                                    color: item.color,
                                    color_code: item.color_code,
                                    amount: item.amount,
                                },
                            ],
                        };
                        const color = {
                            color: item.color,
                            color_code: item.color_code,
                            amount: item.amount,
                        };
                        const itemData = {
                            item_id: item.id,
                            color: item.color,
                            color_code: item.color_code,
                            size: item.size,
                            amount: item.amount,
                        };

                        result.available_size.push(size);
                        result.available_color.push(color);
                        result.items.push(itemData);
                    });

                    db.query(imageQuery, [product.id], (err, imageResults) => {
                        if (err) {
                            console.error('Error fetching product images:', err);
                            return res.status(500).json({ error: 'Error fetching product images' });
                        }

                        // Iterate through the image results and populate the image array
                        imageResults.forEach((image) => {
                            const imageInfo = {
                                image_id: image.id,
                                image_url: image.image_url,
                                image_onColor: image.image_onColor,
                                color: image.color,
                                color_code: image.color_code,
                            };
                            result.image.push(imageInfo);
                        });

                        productsWithFullDetail.push(result);

                        fetchProductDetails(index + 1); // Fetch details for the next product
                    });
                });
            } else {
                // All product details fetched, send the JSON-like data as a response
                res.json(productsWithFullDetail);
            }
        };

        // Start fetching details for the first product
        fetchProductDetails(0);
    });
};
module.exports = {
    createProduct,
    getProductsBySubcategory,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getOneProduct,
    getProductsWithCategories,
    getProductsBySubcategoryWithFullDetail,
    getAllProductsV2
}