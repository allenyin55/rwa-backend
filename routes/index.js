var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/books', db.getAllBooks);
router.get('/api/books/:id', db.getSingleBook);
router.post('/api/books', db.createBook);
router.post('/api/journey', db.createJourney);
router.delete('/api/journey/:book_id/delete', db.deleteJourney);
router.post('/api/books/:id/addReview', db.addAReview);
router.post('/api/books/:id/addComment', db.addComment);
router.get('/api/books/:id/comments', db.getComments);
router.put('/api/books/:id', db.editReview);
router.post('/api/books/:id/deleteReview', db.deleteReview);  //use post instead of delete because axios delete doesn't allow req.body
router.delete('/api/books/:id', db.removeBook);
router.post('/api/books/deleteComment/:id', db.deleteComment);
router.post('/api/profile', db.getBooksOfAUser);
router.post('/api/journey/:id', db.updateUserStats);
router.post('/api/notes', db.createNote);
router.get('/api/notes/:id', db.getNotes);
router.post('/api/notes/:id', db.editNote);
router.delete('/api/notes/:id', db.deleteNote);
router.post('/api/words', db.createWord);
router.get('/api/words/:id', db.getWords);
router.delete('/api/words/:id', db.deleteWord);
router.get('/api/words/def/:word', db.getWordDef);
router.post('/api/words/search', db.searchWords);

router.get('/', function (req, res) {
    res.send('This is a placeholder');
});


module.exports = router;