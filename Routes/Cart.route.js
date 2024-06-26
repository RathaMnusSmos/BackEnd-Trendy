const cartController = require('../controller/Cart.controller')
const { userGuard, adminGuard } = require('../middleware/auth.middleware')

const cart = (app) =>{
    
    app.post('/api/cart/add-to-cart',userGuard, cartController.addToCart)
    app.get('/api/cart', userGuard, cartController.getCartByUser)
    app.get('/api/cart',userGuard, adminGuard, cartController.getAllCarts)
    app.get('/api/cart/getByid/:cart_id', cartController.getCartById)
    app.put('/api/cart/:cart_id', userGuard, cartController.updateCartItem);
    app.delete('/api/cart/:cart_id', userGuard, cartController.deleteCartItem);
    app.delete("/api/cart/delele", cartController.deleteAllCartItems)
    




}

module.exports = cart