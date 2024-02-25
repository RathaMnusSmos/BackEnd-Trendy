const express = require('express');
const db = require('./config/database/db.config')
const path = require('path');
const cors = require('cors')



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





app.listen(5001, () =>{
    console.log("server running in localhost:5001...");
})