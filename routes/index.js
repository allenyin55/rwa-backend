var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/books', db.getAllBooks);
router.get('/api/books/:id', db.getSingleBook);
router.post('/api/books', db.createBook);
router.post('/api/books/:id/addReview', db.addAReview);
router.put('/api/books/:id', db.editReview);
router.delete('/api/books/:id/deleteReview', db.deleteReview);
router.delete('/api/books/:id', db.removeBook);


router.get('/', function (req, res) {
    res.send('adf');
});


module.exports = router;