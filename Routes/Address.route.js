const addressController = require('../controller/Address.controller')
const { userGuard, adminGuard } = require('../middleware/auth.middleware')


const address = (app) =>{
    app.post('/api/address/create', userGuard, addressController.createAddress);
    app.get('/api/address', userGuard, addressController.getAddress)
    app.get('/api/address/:address_id', userGuard, addressController.getAddressById)
    app.delete('/api/address/:address_id', userGuard, addressController.deleteAddress);
    app.put('/api/address/:address_id', userGuard, addressController.updateAddress);
}

module.exports = address