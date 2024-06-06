const express = require('express');
const db = require('./config/database/db.config')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path');
const cors = require('cors')
const { main } = require('./controller/machineLearning/DataPreparation')



const app = express();
app.use(express.json()); //add allow body parames


app.use(cors({
    origin: "*"
}))

const server = http.createServer(app);
const io = new Server(server);


// Middleware
app.use(express.json());

app.use((req, res, next) => {
    req.io = io;
    next();
});


require('./Routes/User.route')(app)
require('./Routes/Product.route')(app)
require('./Routes/Category.route')(app)
require('./Routes/ProductItem.route')(app)
require('./Routes/Image.route')(app)
require('./Routes/Cart.route')(app)
require('./Routes/Order.route')(app)
require('./Routes/Address.route')(app)


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

// io.on('connection', (socket) => {
//     console.log('a user connected');

//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// });

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for order status updates and emit them to the client
    socket.on('orderConfirmed', (data) => {
        console.log('Order confirmed:', data.orderId);
        emitOrderUpdate(data.orderId, 'confirmed');
    });

    socket.on('orderShipping', (data) => {
        console.log('Order shipping:', data.orderId);
        emitOrderUpdate(data.orderId, 'shipping');
    });

    socket.on('orderCompleted', (data) => {
        console.log('Order completed:', data.orderId);
        emitOrderUpdate(data.orderId, 'completed');
    });

    // Function to emit order status update to the client
    const emitOrderUpdate = (orderId, status) => {
        // Fetch the updated order details
        // (You can fetch the details from the database or any other source)
        // For demonstration, I'll emit a simplified version with just orderId and status
        const orderUpdate = {
            orderId: orderId,
            status: status
        };
        io.emit('orderStatusUpdate', orderUpdate);
    };
});

server.listen(5001, () => {
    console.log("server running in localhost:5001...");
})