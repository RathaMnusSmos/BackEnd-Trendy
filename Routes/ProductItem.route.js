const productVariantsController = require('../controller/ProductItem.controller');
const { userGuard, adminGuard } = require('../middleware/auth.middleware')
const { query, validationResult } = require('express-validator');
const { main } = require('../controller/machineLearning/Apriori.Controller')

const productVariant = (app) => {
    // Create a product variant
    app.post('/api/product-variant/', userGuard, adminGuard, productVariantsController.createProductVariant);

    // Get all product variants for a product
    app.get('/api/product-items', userGuard, adminGuard, productVariantsController.getAllProductItems);
    app.get('/api/product-variant/:productId', productVariantsController.getProductVariantsByProductId);
    app.get('/api/product-items/:id', userGuard, adminGuard, productVariantsController.getProductVariantById)

    app.get('/api/allProductItems',
        [
            query('sortBy').isString().optional(),
            query('sortOrder').isIn(['asc', 'desc']).optional(),
        ],
        productVariantsController.getAllProductItemsSorted
    );


    // Update a product variant
    app.put('/api/product-variant/:id', userGuard, adminGuard, productVariantsController.updateProductVariant);

    // Delete a product variant
    app.delete('/api/product-variant/:id', userGuard, adminGuard, productVariantsController.deleteProductVariant);
    // New endpoint to get product recommendations
    app.get('/api/recommendations/:productId', async (req, res) => {
        const { productId } = req.params;
        try {
            const recommendations = await main(productId);
            res.json(recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({ error: 'An error occurred while fetching recommendations.' });
        }
    });

}



module.exports = productVariant;
