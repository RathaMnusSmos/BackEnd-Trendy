const categoryController = require("../controller/Category.controller")
const { userGuard, adminGuard } = require('../middleware/auth.middleware')


const category = (app) => {

    app.post('/api/categories',userGuard, adminGuard, categoryController.createTopLevelCategory)
    app.post('/api/categories/subcategories',userGuard, adminGuard, categoryController.createSubCategory)
    app.get('/api/categories', categoryController.getTopLevelCategory)
    app.get('/api/categories/:id/subcategories', categoryController.getCategoryWithParentId)
    app.get('/api/categories/:id',categoryController.getOne)
    app.put('/api/categories/:id',userGuard, adminGuard, categoryController.updateCategory)
    app.delete('/api/category/delete/:id',userGuard, adminGuard, categoryController.deleteCategory)
    

}

module.exports = category