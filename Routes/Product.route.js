const productController = require("../controller/Product.controller")
const { userGuard, adminGuard } = require('../middleware/auth.middleware')


const product = (app) => {

    // app.post('/api/product/create', productController.createProduct)
    // app.get('/api/product/get-all', userController.getAll)
    // app.get('/api/product/get-one/:id',userGuard ,userController.getOne)
    // app.put('/api/product/update', userController.updateUser)
    // app.delete('/api/product/delete/:id', userController.deleteUser)
    // Product Routes
    app.post('/api/products',userGuard, adminGuard, productController.createProduct);
    app.get('/api/products/:subcategory_id', productController.getProductsBySubcategory);
    app.put('/api/products/:id',userGuard, adminGuard, productController.updateProduct);
    app.delete('/api/products/:id',userGuard, adminGuard, productController.deleteProduct);
    app.get('/api/products', productController.getAllProducts);
    app.get('/api/products/get-one/:id', productController.getOneProduct);
    app.get('/api/products-with-categories', productController.getProductsWithCategories);
    app.get('/api/products-detail-by-subcategory/:subcategory_id', productController.getProductsBySubcategoryWithFullDetail);
    app.get('/api/productsV2', productController.getAllProductsV2);


    // app.get('/api/getProductDetail-byId/:productId', productController.getProductWithDetails);

}

module.exports = product