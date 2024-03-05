const orderController = require('../controller/Order.controller')
const {userGuard, adminGuard} = require('../middleware/auth.middleware')

const order = (app) =>{
    app.get('/api/order/initiate',userGuard, orderController.checkOutCart)
    app.post('/api/order/ordering', userGuard, orderController.placeOrder)
    app.get('/api/order/get-history_order', userGuard, orderController.getOrderHistoryByUserId)
    app.get('/api/order/getAllOrder', userGuard, adminGuard, orderController.getAllOrdersForAdmin)


}

module.exports = order