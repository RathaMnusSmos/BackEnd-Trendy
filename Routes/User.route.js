const userController = require("../controller/User.controller")
const { userGuard, adminGuard } = require('../middleware/auth.middleware')
const user = (app) => {


    app.post('/api/user/create', userController.create)
    app.get('/api/user/get-all',userGuard, adminGuard, userController.getAll)
    app.get('/api/user/get-one/:id',userGuard, adminGuard, userController.getOne)
    app.get('/api/user/get-one-address/:id',userGuard ,userController.getOneWithAddress)
    app.put('/api/user/update',userGuard, userController.updateUser)
    app.delete('/api/user/delete/:id',userGuard, adminGuard, userController.deleteUser)
    app.post('/api/user/login/user', userController.userLogin)
    app.post('/api/user/login/admin', userController.adminLogin)
    app.get('/api/user/get-one', userGuard, userController.getUserInfo)


}

module.exports = user