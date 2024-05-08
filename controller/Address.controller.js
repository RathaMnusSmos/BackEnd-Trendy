const db = require('../config/database/db.config')

const createAddress = (req, res) =>{
    const user_id = req.user.user_id;
    const {address_name, recipient_name, recipient_phone, address_line, latitude, longitude, khan} = req.body;

    if (user_id) {

        const createAddressquery = 'INSERT INTO addresses (user_id, address_name, recipient_name, recipient_phone, address_line, latitude, longitude, khan) VALUE (?, ?, ?, ?, ?, ?, ?, ?)';
        const queryParams = [user_id, address_name, recipient_name, recipient_phone, address_line, latitude, longitude, khan]
        db.query(createAddressquery, queryParams, (err, result) =>{
            if (err) {
                console.error('Error create address:', err);
                return res.status(500).json({
                    error: true,
                    message: "create fail",
                    messages: {
                        err: 'Error creating address'
                    }

                });
            }

            res.json({ message: 'Address created successfully' });
        })

    } else {
        res.status(403).json({
            error: true,
            message: "create fail",
            messages: {
                err: "You don't have permission to create address"
            }
        });
    }



}

const getAddress = (req, res) =>{
    const user_id = req.user.user_id;
    if (user_id) {

        const query = 'SELECT * FROM addresses WHERE user_id = ?'
        db.query(query, user_id, (err, result) =>{
            if(err){
                return res.status(500).json({
                    error: true,
                    message: "create fail",
                    messages: {
                        err: 'Error creating address'
                    }

                });
            }
            res.json({ address: result });
        })

    } else {
        res.status(403).json({
            error: true,
            message: "Get fail",
            messages: {
                err: "You don't have permission to Get address"
            }
        });
    }
}

const deleteAddress = (req, res) => {
    const user_id = req.user.user_id;
    const address_id = req.params.address_id;

    if (user_id) {
        const deleteAddressQuery = 'DELETE FROM addresses WHERE user_id = ? AND id = ?';
        const queryParams = [user_id, address_id];
        
        db.query(deleteAddressQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error deleting address:', err);
                return res.status(500).json({
                    error: true,
                    message: "Delete failed",
                    messages: {
                        err: 'Error deleting address'
                    }
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: true,
                    message: "Delete failed",
                    messages: {
                        err: "Address not found or you don't have permission to delete"
                    }
                });
            }

            res.json({ message: 'Address deleted successfully' });
        });
    } else {
        res.status(403).json({
            error: true,
            message: "Delete failed",
            messages: {
                err: "You don't have permission to delete address"
            }
        });
    }
}

const updateAddress = (req, res) => {
    const user_id = req.user.user_id;
    const address_id = req.params.address_id;
    const { address_name, recipient_name, recipient_phone, address_line, latitude, longitude, khan } = req.body;

    if (user_id) {
        const updateAddressQuery = 'UPDATE addresses SET address_name = ?, recipient_name = ?, recipient_phone = ?, address_line = ?, latitude = ?, longitude = ?, khan = ? WHERE user_id = ? AND id = ?';
        const queryParams = [address_name, recipient_name, recipient_phone, address_line, latitude, longitude, khan, user_id, address_id];

        db.query(updateAddressQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating address:', err);
                return res.status(500).json({
                    error: true,
                    message: "Update failed",
                    messages: {
                        err: 'Error updating address'
                    }
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: true,
                    message: "Update failed",
                    messages: {
                        err: "Address not found or you don't have permission to update"
                    }
                });
            }

            res.json({ message: 'Address updated successfully' });
        });
    } else {
        res.status(403).json({
            error: true,
            message: "Update failed",
            messages: {
                err: "You don't have permission to update address"
            }
        });
    }
}

const getAddressById = (req, res) => {
    const user_id = req.user.user_id;
    const address_id = req.params.address_id;

    if (user_id) {
        const query = 'SELECT * FROM addresses WHERE user_id = ? AND id = ?';
        const queryParams = [user_id, address_id];

        db.query(query, queryParams, (err, result) => {
            if (err) {
                console.error('Error fetching address by ID:', err);
                return res.status(500).json({
                    error: true,
                    message: "Failed to fetch address",
                    messages: {
                        err: 'Error fetching address'
                    }
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    error: true,
                    message: "Address not found",
                    messages: {
                        err: "Address not found or you don't have permission to access"
                    }
                });
            }

            res.json({ address: result[0] }); // Assuming there's only one address with a given ID
        });
    } else {
        res.status(403).json({
            error: true,
            message: "Failed to fetch address",
            messages: {
                err: "You don't have permission to access address"
            }
        });
    }
}


module.exports = {
    createAddress,
    getAddress,
    deleteAddress,
    updateAddress,
    getAddressById
}