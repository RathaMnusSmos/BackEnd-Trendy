const db = require('../config/database/db.config')

const createTopLevelCategory = (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO Category (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            console.error('Error creating top-level category:', err);
            return res.status(500).json({ error: 'Error creating top-level category' });
        }
        res.status(201).json({ message: 'Top-level category created', categoryId: result.insertId });
    });
}

const createSubCategory = (req, res) => {
    const { name, parent_id } = req.body;
    const query = 'INSERT INTO Category (name, parent_id) VALUES (?, ?)';
    db.query(query, [name, parent_id], (err, result) => {
        if (err) {
            console.error('Error creating subcategory:', err);
            return res.status(500).json({ error: 'Error creating subcategory' });
        }
        res.status(201).json({ message: 'Subcategory created', categoryId: result.insertId });
    });
}

// const getTopLevelCategory = (req, res) => {
//     const query = 'SELECT * FROM Category WHERE parent_id IS NULL'; // Fetch top-level categories
//     db.query(query, (err, results) => {
//         if (err) {
//             console.error('Error fetching top-level categories:', err);
//             return res.status(500).json({ error: 'Error fetching categories' });
//         }
//         res.json(results);
//     });
// }

// const getCategoryWithParentId = (req, res) => {
//     const topCategoryId = req.params.id;
//     const query = 'SELECT * FROM Category WHERE parent_id = ?';
//     db.query(query, [topCategoryId], (err, results) => {
//         if (err) {
//             console.error('Error fetching subcategories:', err);
//             return res.status(500).json({ error: 'Error fetching subcategories' });
//         }
//         res.json(results);
//     });
// }

const getTopLevelCategory = (req, res) => {
    const query = 'SELECT c.*, ci.image_url FROM Category c LEFT JOIN categoryimages ci ON c.id = ci.category_id WHERE c.parent_id IS NULL';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching top-level categories:', err);
            return res.status(500).json({ error: 'Error fetching categories' });
        }
        res.json(results);
    });
}

// const getCategoryWithParentId = (req, res) => {
//     const topCategoryId = req.params.id;
//     const query = 'SELECT c.*, ci.image_url FROM Category c LEFT JOIN categoryimages ci ON c.id = ci.category_id WHERE c.parent_id = ?';
//     db.query(query, [topCategoryId], (err, results) => {
//         if (err) {
//             console.error('Error fetching subcategories:', err);
//             return res.status(500).json({ error: 'Error fetching subcategories' });
//         }
//         res.json(results);
//     });
// }
const getCategoryWithParentId = (req, res) => {
    const topCategoryId = req.params.id;
    const sortOrder = req.query.sortOrder; // Get the sortOrder query parameter

    let query = 'SELECT c.*, ci.image_url FROM Category c LEFT JOIN categoryimages ci ON c.id = ci.category_id WHERE c.parent_id = ?';

    if (sortOrder === 'old') {
        query += ' ORDER BY c.created_at ASC'; // Sorting by date_created in ascending order (oldest first)
    } else if (sortOrder === 'new') {
        query += ' ORDER BY c.created_at DESC'; // Sorting by date_created in descending order (newest first)
    }

    db.query(query, [topCategoryId], (err, results) => {
        if (err) {
            console.error('Error fetching subcategories:', err);
            return res.status(500).json({ error: 'Error fetching subcategories' });
        }
        res.json(results);
    });
}



const getOne = (req, res) => {
    const categoryId = req.params.id;
    const query = 'SELECT * FROM Category WHERE id = ?';
    db.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return res.status(500).json({ error: 'Error fetching category' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(results[0]);
    });

}

const updateCategory = (req, res) => {
    const categoryId = req.params.id;
    const { name, image_url, parent_id } = req.body;

    // Check if the parent_id is present to determine whether it's a subcategory update
    if (parent_id !== undefined) {
        const query = 'UPDATE Category SET name = ?, image_url = ?, parent_id = ? WHERE id = ?';
        db.query(query, [name, image_url, parent_id, categoryId], (err, result) => {
            if (err) {
                console.error('Error updating subcategory:', err);
                return res.status(500).json({ error: 'Error updating subcategory' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Subcategory not found' });
            }
            res.json({ message: 'Subcategory updated' });
        });
    } else {
        // Handle top-level category update here
        const query = 'UPDATE Category SET name = ?, image_url = ? WHERE id = ?';
        db.query(query, [name, image_url, categoryId], (err, result) => {
            if (err) {
                console.error('Error updating top-level category:', err);
                return res.status(500).json({ error: 'Error updating top-level category' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Top-level category not found' });
            }
            res.json({ message: 'Top-level category updated' });
        });
    }
}

const deleteCategory = (req, res) => {
    const categoryId = req.params.id;
    const query = 'DELETE FROM Category WHERE id = ?';

    // Check if the category has a parent_id to determine if it's a subcategory
    db.query('SELECT parent_id FROM Category WHERE id = ?', [categoryId], (err, results) => {
        if (err) {
            console.error('Error checking category:', err);
            return res.status(500).json({ error: 'Error checking category' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (results[0].parent_id !== null) {
            // Subcategory deletion
            db.query(query, [categoryId], (err, result) => {
                if (err) {
                    console.error('Error deleting subcategory:', err);
                    return res.status(500).json({ error: 'Error deleting subcategory' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Subcategory not found' });
                }
                res.json({ message: 'Subcategory deleted' });
            });
        } else {
            // Top-level category deletion
            db.query(query, [categoryId], (err, result) => {
                if (err) {
                    console.error('Error deleting category:', err);
                    return res.status(500).json({ error: 'Error deleting category' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Category not found' });
                }
                res.json({ message: 'Category deleted' });
            });
        }
    });
}

module.exports = {
    createTopLevelCategory,
    createSubCategory,
    getTopLevelCategory,
    getCategoryWithParentId,
    getOne,
    updateCategory,
    deleteCategory
}
