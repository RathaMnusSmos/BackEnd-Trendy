const imageController = require('../controller/Image.controller')



const image = (app) => {

    // Mount the image controller as a route
    app.use('/api/images', imageController);
    
}

module.exports = image