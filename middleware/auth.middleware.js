require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.userGuard = (req, res, next) => {
    var authorization = req.headers.authorization;
    var token_from_client = null;

    if (authorization != null && authorization != "") {
        token_from_client = authorization.split(" ");
        token_from_client = token_from_client[1];
    }

    if (token_from_client == null || token_from_client == "") {
        res.status(401).send({
            message: 'unauthorized'
        });
    } else {
        jwt.verify(token_from_client, process.env.TOKEN_KEY, (error, data) => {
            if (error) {
                res.status(401).send({
                    message: 'Unauthorized',
                });
            } else {
                // Attach the user data to req.user
                req.user = data.data.user; // Assuming user data is nested under 'data.user' in the token

                next();
            }
        });
    }
};


exports.adminGuard = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        // User is an admin
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};