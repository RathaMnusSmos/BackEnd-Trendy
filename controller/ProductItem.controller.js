const db = require('../config/database/db.config');
const { validationResult } = require('express-validator');

// Create a product variant
const createProductVariant = (req, res) => {
    const { product_id, size, color, color_code, amount } = req.body;
    const query = 'INSERT INTO product_items (product_id, size, color, color_code, amount) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [product_id, size, color, color_code, amount], (err, result) => {
        if (err) {
            console.error('Error creating product variant:', err);
            return res.status(500).json({ error: 'Error creating product variant' });
        }
        res.status(201).json({ message: 'Product variant created', productVariantId: result.insertId });
    });
};
//get all products variants
// const getAllProductItems = (req, res) => {
//     const { size, page = 1, limit = 10 } = req.query;

//     let query = 'SELECT * FROM product_items';
//     let queryParams = [];

//     if (size) {
//         query += ' WHERE size = ?';
//         queryParams.push(size);
//     }

//     const offset = (page - 1) * limit;
//     query += ` LIMIT ${limit} OFFSET ${offset}`;

//     db.query(query, queryParams, (err, results) => {
//         if (err) {
//             console.error('Error fetching product items:', err);
//             return res.status(500).json({ error: 'Error fetching product items' });
//         }

//         res.json(results);
//     });
// };
const getAllProductItems = (req, res) => {
    const { size, page = 1, limit = 10 } = req.query;

    let query = `
        SELECT pi.*, p.product_name as product_name
        FROM product_items pi
        LEFT JOIN products p ON pi.product_id = p.id
    `;

    let queryParams = [];

    if (size) {
        query += ' WHERE pi.size = ?';
        queryParams.push(size);
    }

    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching product items:', err);
            return res.status(500).json({ error: 'Error fetching product items' });
        }

        res.json(results);
    });
};

// Get all product variants for a product
const getProductVariantsByProductId = (req, res) => {
    const productId = req.params.productId;
    const query = 'SELECT * FROM product_items WHERE product_id = ?';
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product variants:', err);
            return res.status(500).json({ error: 'Error fetching product variants' });
        }
        res.json(results);
    });
};
// Get all product items and sort dynamically

const getAllProductItemsSorted = (req, res) => {
    const sortBy = req.query.sortBy || '';
    const sortOrder = req.query.sortOrder || 'asc';

    // Check if sorting parameters are provided
    const isSortingRequested = sortBy !== '' || sortOrder !== 'asc';

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // SQL query with JOIN to retrieve product items and product names with optional sorting
    const query = `
        SELECT product_items.*, products.product_name
        FROM product_items
        INNER JOIN products ON product_items.product_id = products.id
        ${isSortingRequested ? `ORDER BY ${sortBy} ${sortOrder}` : ''}
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching product items:', err);
            return res.status(500).json({ error: 'Error fetching product items' });
        }
        res.json(results);
    });
};

// Update a product variant
// Update a product variant
const updateProductVariant = (req, res) => {
    const productVariantId = req.params.id;
    const { product_id, size, color, color_code, amount } = req.body;
    const query = 'UPDATE product_items SET product_id = ?, size = ?, color = ?, color_code = ?, amount = ? WHERE id = ?';
    db.query(query, [product_id, size, color, color_code, amount, productVariantId], (err, result) => {
        if (err) {
            console.error('Error updating product variant:', err);
            return res.status(500).json({ error: 'Error updating product variant' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product variant not found' });
        }
        res.json({ message: 'Product variant updated successfully' });
    });
};

// Get a product variant by ID
// Get a product variant by ID
const getProductVariantById = (req, res) => {
    const productVariantId = req.params.id;
    const query = `
        SELECT pi.*, p.product_name
        FROM product_items pi
        INNER JOIN products p ON pi.product_id = p.id
        WHERE pi.id = ?`;

    db.query(query, [productVariantId], (err, results) => {
        if (err) {
            console.error('Error fetching product variant by ID:', err);
            return res.status(500).json({ error: 'Error fetching product variant' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Product variant not found' });
        }

        const productVariant = results[0];
        res.json(productVariant);
    });
};




// Delete a product variant
const deleteProductVariant = (req, res) => {
    const productVariantId = req.params.id;
    const query = 'DELETE FROM product_items WHERE id = ?';
    db.query(query, [productVariantId], (err, result) => {
        if (err) {
            console.error('Error deleting product variant:', err);
            return res.status(500).json({ error: 'Error deleting product variant' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product variant not found' });
        }
        res.json({ message: 'Product variant deleted' });
    });
};

module.exports = {
    createProductVariant,
    getProductVariantsByProductId,
    updateProductVariant,
    deleteProductVariant,
    getAllProductItems,
    getProductVariantById,
    getAllProductItemsSorted
};
