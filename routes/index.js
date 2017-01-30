var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/books', db.getAllBooks);
router.get('/api/books/:id', db.getSingleBook);
router.post('/api/books', db.createBook);
router.post('/api/journey', db.createJourney);
router.post('/api/books/:id/addReview', db.addAReview);
router.post('/api/books/:id/addComment', db.addComment);
router.put('/api/books/:id', db.editReview);
router.post('/api/books/:id/deleteReview', db.deleteReview);  //use post instead of delete because axios delete doesn't allow req.body
router.delete('/api/books/:id', db.removeBook);
router.post('/api/profile', db.getBooksOfAUser);


router.get('/', function (req, res) {
    res.send('This is a placeholder');
});


module.exports = router;