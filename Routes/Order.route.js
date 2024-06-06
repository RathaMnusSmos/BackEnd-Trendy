const orderController = require('../controller/Order.controller')
const {userGuard, adminGuard} = require('../middleware/auth.middleware')
const orderControllerV2 = require('../controller/OrdersV2.controller')


const order = (app) =>{
    app.post('/api/order/initiate',userGuard, orderControllerV2.checkout)
    app.post('/api/order/ordering', userGuard, orderControllerV2.placeOrder)
    app.get('/api/order/get-history_order', userGuard, orderController.getOrderHistoryByUserId)
    app.get('/api/order/getAllOrder', userGuard, adminGuard, orderController.getAllOrdersForAdmin)
    app.get('/api/order/getAllOrder/ml', orderController.getAllOrdersForML)


    // app.get('/api/order/ordering',userGuard, adminGuard, orderControllerV2.getOrders)
    app.get('/api/order/ordering',userGuard, adminGuard, orderControllerV2.getPendingOrders)
    app.get('/api/order/ordering/:id',userGuard, adminGuard, orderControllerV2.getOrderDetails)
    app.put('/api/order/confirm-ordering/:orderId', userGuard, adminGuard, orderControllerV2.confirmOrder)
    // app.get('/api/order/user-ordering', userGuard, orderControllerV2.getUserOrderPending)
    app.get('/api/order/user-ordering', userGuard, orderControllerV2.getUserOrders)
    app.get('/api/order/ordering-history',userGuard, orderControllerV2.getOrderHistoryByUserAuth)


}

module.exports = order