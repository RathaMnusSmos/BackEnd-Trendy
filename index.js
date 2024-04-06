const express = require('express');
const db = require('./config/database/db.config')
const path = require('path');
const cors = require('cors')
const { main } = require('./controller/machineLearning/DataPreparation')



const app = express();
app.use(express.json()); //add allow body parames
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));
app.set('view engine', 'hbs');

app.use(cors({
    origin: "*"
}))


app.get('/', (req, res) => {
    // res.send("<h1>Welcome Home</h1>");
    res.render('view')
});




require('./Routes/User.route')(app)
require('./Routes/Product.route')(app)
require('./Routes/Category.route')(app)
require('./Routes/ProductItem.route')(app)
require('./Routes/Image.route')(app)
require('./Routes/Cart.route')(app)
require('./Routes/Order.route')(app)

// main()
//     .then(() => {
//         console.log('Data preparation completed successfully.');
//     })
//     .catch((error) => {
//         console.error('Error during data preparation:', error);
//     });

// New endpoint to get product recommendations
// app.get('/recommendations/:productId', async (req, res) => {
//     const { productId } = req.params;
//     try {
//       const recommendations = await main(productId);
//       res.json(recommendations);
//     } catch (error) {
//       console.error('Error getting recommendations:', error);
//       res.status(500).json({ error: 'An error occurred while fetching recommendations.' });
//     }
//   });
  

app.listen(5001, () => {
    console.log("server running in localhost:5001...");
})