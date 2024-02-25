const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary');
const dotenv = require('dotenv');
const db = require('../config/database/db.config'); //database configuration

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage configuration
const storage = multer.memoryStorage(); // Store the image as a buffer
const upload = multer({ storage });

const router = express.Router();

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  cloudinary.uploader.upload_stream((result) => {
    if (result && result.secure_url) {
      const { product_id, image_onColor, color, color_code } = req.body;
      if (!product_id) {
        return res.status(400).send('Missing product_id required fields');
      }
      const insertQuery = 'INSERT INTO images (product_id, image_url, image_onColor, color, color_code, public_id) VALUES (?, ?, ?, ?, ?, ?)';

      db.query(insertQuery, [product_id, result.secure_url, image_onColor, color, color_code, result.public_id], (err, insertResult) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error creating the image');
        } else {
          res.status(201).json({
            message: 'Image created successfully',
            public_id: result.public_id, // Include public_id in the response
          });
        }
      });
    } else {
      return res.status(500).json({ error: 'Error uploading the image to Cloudinary' });
    }
  }).end(req.file.buffer);
});

//category upload 
router.post('/upload/category', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  cloudinary.uploader.upload_stream((result) => {
    if (result && result.secure_url) {
      const { category_id} = req.body;
      if (!category_id) {
        return res.status(400).send('Missing category_id required fields');
      }
      const insertQuery = 'INSERT INTO categoryimages (category_id, public_id, image_url) VALUES (?, ?, ?)';

      db.query(insertQuery, [category_id, result.public_id,  result.secure_url], (err, insertResult) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error creating the image');
        } else {
          res.status(201).json({
            message: 'Image created successfully',
            public_id: result.public_id, // Include public_id in the response
          });
        }
      });
    } else {
      return res.status(500).json({ error: 'Error uploading the image to Cloudinary' });
    }
  }).end(req.file.buffer);
});

//update the image
router.put('/update/:id', upload.single('image'), (req, res) => {
  const imageId = req.params.id;

  // First, retrieve the old image's URL from the database
  db.query('SELECT public_id FROM images WHERE id = ?', [imageId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error retrieving old image information' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    
    const oldPublicId = result[0].public_id;
    

    // Attempt to delete the old image from Cloudinary
    cloudinary.uploader.destroy(oldPublicId, (cloudinaryError, cloudinaryResult) => {
      if (cloudinaryError) {
        console.error('Error from Cloudinary:', cloudinaryError);
      }

      // Next, upload the new image to Cloudinary
      cloudinary.uploader.upload_stream((uploadResult) => {
        if (uploadResult && uploadResult.secure_url) {
          const { product_id, image_onColor, color, color_code } = req.body;
          if (!product_id) {
            return res.status(400).json({ error: 'Missing product_id required fields' });
          }
          const updateQuery = 'UPDATE images SET product_id = ?, image_url = ?, public_id = ?, image_onColor = ?, color = ?, color_code = ? WHERE id = ?';

          db.query(updateQuery, [product_id, uploadResult.secure_url, uploadResult.public_id, image_onColor, color, color_code, imageId], (updateErr, updateResult) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({ error: 'Error updating the image in the database' });
            }

            res.status(200).json({ message: 'Image updated successfully' });
          });
        } else {
          return res.status(500).json({ error: 'Error uploading the new image to Cloudinary' });
        }
      }).end(req.file.buffer);



    });
  });
});


//update the image category
router.put('/update/category/:id', upload.single('image'), (req, res) => {
  const imageId = req.params.id;

  // First, retrieve the old image's URL from the database
  db.query('SELECT public_id FROM categoryimages WHERE id = ?', [imageId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error retrieving old image information' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    
    const oldPublicId = result[0].public_id;
    

    // Attempt to delete the old image from Cloudinary
    cloudinary.uploader.destroy(oldPublicId, (cloudinaryError, cloudinaryResult) => {
      if (cloudinaryError) {
        console.error('Error from Cloudinary:', cloudinaryError);
      }

      // Next, upload the new image to Cloudinary
      cloudinary.uploader.upload_stream((uploadResult) => {
        if (uploadResult && uploadResult.secure_url) {
          const { category_id} = req.body;
          if (!category_id) {
            return res.status(400).json({ error: 'Missing category_id required fields' });
          }
          const updateQuery = 'UPDATE categoryimages SET category_id = ?, public_id = ?, image_url = ? WHERE id = ?';

          db.query(updateQuery, [category_id, uploadResult.public_id, uploadResult.secure_url, imageId], (updateErr, updateResult) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({ error: 'Error updating the image in the database' });
            }

            res.status(200).json({ message: 'Image updated successfully' });
          });
        } else {
          return res.status(500).json({ error: 'Error uploading the new image to Cloudinary' });
        }
      }).end(req.file.buffer);



    });
  });
});
// Create a route to delete an image by its public_id
router.delete('/delete/:publicId', (req, res) => {
  const publicId = req.params.publicId;

  // Delete the image from Cloudinary
  cloudinary.uploader.destroy(publicId, (cloudinaryError, cloudinaryResult) => {
    if (cloudinaryError) {
      console.error('Error from Cloudinary:', cloudinaryError);
    }


    // Delete the database record
    const deleteQuery = 'DELETE FROM images WHERE public_id = ?';

    db.query(deleteQuery, [publicId], (dbError, dbResult) => {
      if (dbError) {
        return res.status(500).json({ message: 'Error deleting the image from the database' });
      }

      console.log('Result from MySQL:', dbResult);
      res.status(200).json({ message: 'Image deleted successfully' });
    });
  });
});

// Create a route to delete an image category by its public_id
router.delete('/delete/category/:publicId', (req, res) => {
  const publicId = req.params.publicId;

  // Delete the image from Cloudinary
  cloudinary.uploader.destroy(publicId, (cloudinaryError, cloudinaryResult) => {
    if (cloudinaryError) {
      console.error('Error from Cloudinary:', cloudinaryError);
    }


    // Delete the database record
    const deleteQuery = 'DELETE FROM categoryimages WHERE public_id = ?';

    db.query(deleteQuery, [publicId], (dbError, dbResult) => {
      if (dbError) {
        return res.status(500).json({ message: 'Error deleting the image from the database' });
      }

      console.log('Result from MySQL:', dbResult);
      res.status(200).json({ message: 'Image deleted successfully' });
    });
  });
});



module.exports = router;