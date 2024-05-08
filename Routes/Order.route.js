const orderController = require('../controller/Order.controller')
const {userGuard, adminGuard} = require('../middleware/auth.middleware')
const orderControllerV2 = require('../controller/OrdersV2.controller')


const order = (app) =>{
    app.post('/api/order/initiate',userGuard, orderControllerV2.checkout)
    app.post('/api/order/ordering', userGuard, orderControllerV2.createOrder)
    app.get('/api/order/get-history_order', userGuard, orderController.getOrderHistoryByUserId)
    app.get('/api/order/getAllOrder', userGuard, adminGuard, orderController.getAllOrdersForAdmin)
    app.get('/api/order/getAllOrder/ml', orderController.getAllOrdersForML)



}

module.exports = order