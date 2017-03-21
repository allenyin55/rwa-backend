const promise = require('bluebird'),
      axios = require('axios'),
      fs = require('fs');

const OXFORD_DIC_URL = 'https://od-api.oxforddictionaries.com/api/v1/entries/en';
const OXFORD_APP_ID = '1b843d1e';
const OXFORD_APP_KEY = '1dcd9eb3927afb2415fc4ac331d8f2d8';

const options = {
    // Initialization Options
    promiseLib: promise
};

const pgp = require('pg-promise')(options);
var cn = {
    host:"ec2-54-163-225-208.compute-1.amazonaws.com",
    port: 5432,
    database: 'd99m473ab6h247',
    user: 'kbatncdacntkir',
    password: '646fe6cb14b266c3704173da5a243abc07439f8068ad618486665285ea231bc2',
    ssl: true
};

/*const cn = {
  host: "localhost",
  port:5432,
  database: "books",
  user: "Allen",
  password: "yhn960716"
};*/

const db = pgp(cn);

// add query functions

module.exports = {
  getAllBooks: getAllBooks,
  getSingleBook: getSingleBook,
  createBook: createBook,
  createJourney: createJourney,
  deleteJourney: deleteJourney,
  addAReview: addAReview,
  addComment: addComment,
  getComments: getComments,
  deleteComment: deleteComment,
  editReview: editReview,
  deleteReview: deleteReview,
  removeBook: removeBook,
  getBooksOfAUser: getBooksOfAUser,
  updateUserStats: updateUserStats,
  createNote: createNote,
  getNotes: getNotes,
  editNote: editNote,
  deleteNote: deleteNote,
  createWord: createWord,
  getWords: getWords,
  deleteWord: deleteWord,
  getWordDef: getWordDef, 
  searchWords: searchWords
};

//db.tx (transcation) is used to make multiple changes
//db.task is used to execute multiple read-only queries

function getAllBooks(req, res, next) {
    db.any('select * from books')
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data.reverse(),
                    message: 'Retrieved ALL books'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getSingleBook(req, res, next) {
    var bookID = parseInt(req.params.id);
    db.one('select * from books where id = $1', bookID)
        .then(function (book) {
            db.any('select * from reviews where book_id = $1', bookID)
                .then(function (reviews) {
                    res.status(200)
                        .json({
                            status: 'success',
                            book: book,
                            reviews: reviews,
                            message: 'Retrieved ONE book'
                        });
                })
                .catch(function (err) {
                    return next(err);
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function createBook(req, res, next) {
  const book = req.body;
  db.tx(function (t) {
    //insert a new book if there is no book in the database with the same title

    //not exists (select title from books where title = $1) returning id;

    //the above statement will return the id of the book just inserted if it's
    //a new book

    //select id from books where title = $1
    //the above statement is used to return the id of the book if the book
    //is already in the datebase

    //the returned id then was used to insert reviews into reviews table

    return t.any('insert into books(title, bookInfo, dateAdded) ' + 
      'select $1, $2, $3 where ' +
      'not exists (select title from books where title = $1) returning id;' +
      'select id from books where title = $1',
      [book.title, book.bookInfo, book.dateAdded])
      .then(function (data) {
        return t.one('insert into reviews(book_id, review, reviewer, dateEdited, rating)' +
          'values($1, $2, $3, $4, $5) returning book_id',
          [data[0].id, book.review, book.reviewer, book.dateEdited, book.rating])
      })

      // retrieve all the ratings from reviews table
      //calcualte the average and then store the result in avg_rating col in books
      .then(function(data) {
        return t.none('update books set avg_rating = ' + 
          '(select avg(rating) from reviews where book_id = $1) where id = $1', 
          [data.book_id])
      })
  })
  .then(function () {
    res.status(200)
      .json({
        status: 'success',
        message: 'Inserted one book'
      });
  })
  .catch(function (err) {
    console.log(err)
    return next(err);
  });
}

function createJourney(req, res, next) {
  console.log(req.body)
  db.tx(function (t) {
    return t.any('insert into books(title, bookInfo, dateAdded) select $1, $2, $3 where ' +
      'not exists (select title from books where title = $1) returning id;' +
      'select id from books where title = $1',
      [req.body.title, req.body.bookInfo, req.body.dateAdded])
      .then(function(data) {
        return t.any('insert into read_stats(book_id, profile_id, note, ' + 
          '"startingDate", initial_feeling, reading_status)' +
          'select $1, $2, $3, $4, $5, $6 ' + 
          'where not exists (select book_id, profile_id from ' +
          'read_stats where book_id = $1 and profile_id = $2) returning id;' +
          'select id from read_stats where book_id = $1',
          [data[0].id, req.body.profile_id, req.body.note, 
           req.body.startingDate, parseInt(req.body.initial_feeling),
           parseInt(req.body.reading_status)])
      })
  })
  .then(function (data) {
    res.status(200)
      .json({
        status: 'success',
        message: 'Inserted one journey'
      });
  })
  .catch(function (err) {
    console.log(err);
    return next(err);
  });
}

function deleteJourney(req, res, next){
  db.none('delete from read_stats where book_id=$1', req.params.book_id)
    .then(function (result) {
            /* jshint ignore:start */
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Deleted a journey'
                });
            /* jshint ignore:end */
        })
        .catch(function (err) {
          console.log(err);
          return next(err);
        });
}

function addAReview(req, res, next) {
  const book = req.body;

  // add a review and at the same time update avg_rating in books table
  db.tx(function (t) {
    return t.one('insert into reviews(book_id, review, reviewer, dateEdited, rating)'+
            'values($1, $2, $3, $4, $5) returning book_id',
        [parseInt(req.params.id), book.review, book.reviewer, book.dateEdited, book.rating])
    .then(function(data){
      return t.none('update books set avg_rating = ' + 
          '(select avg(rating) from reviews where book_id = $1) where id = $1', 
          [data.book_id])
    })
  })
  .then(function () {
      res.status(200)
          .json({
              status: 'success',
              message: 'Added a review'
          });
  })
  .catch(function (err) {
      return next(err);
  });
}

function editReview(req, res, next) {
  const review = req.body;
  console.log(review)
  db.none('update reviews set review=$1, reviewer=$2, dateEdited=$3, ' + 
    'rating=$4 where review_id=$5',
      [review.review, review.reviewer, review.dateEdited, review.rating, review.review_id])
      .then(function () {
          res.status(200)
              .json({
                  status: 'success',
                  message: 'Updated review'
              });
      })
      .catch(function (err) {
        console.log(err);
        return next(err);
      });
}

function deleteReview(req, res, next) {
    db.result('delete from reviews where review_id = $1', req.body.review_id)
        .then(function (result) {
            /* jshint ignore:start */
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Deleted review'
                });
            /* jshint ignore:end */
        })
        .catch(function (err) {
            return next(err);
        });
}

function addComment(req, res, next){
  console.log(req.body)
  db.none('insert into comments(review_id, book_id, parentcomment_id,' + 
        'commentcontent, commenter, dateedited)' + 
          'values($1, $2, $3, $4, $5, $6)',
          [parseInt(req.params.id), req.body.book_id, req.body.parentcomment_id,
          req.body.commentContent, req.body.commenter, req.body.dateEdited])
          .then(function(){
            res.status(200)
                .json({
                  status: 'success',
                  message: 'Added a comment'
                })
          })
          .catch(function(err){
            console.log(err)
            return next(err);
          })

}

function getComments(req, res, next){
  db.any("select * from comments where book_id = $1", req.params.id)
  .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved Comments'
                });
        })
        .catch(function (err) {
            console.log(err);
            return next(err);
        });
}

function deleteComment(req, res, next){
  db.result('delete from comments where comment_id = $1', req.params.id)
        .then(function (result) {
            /* jshint ignore:start */
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Deleted comment'
                });
            /* jshint ignore:end */
        })
        .catch(function (err) {
            return next(err);
        });
}

function removeBook(req, res, next) {
    var bookID = parseInt(req.params.id);
    db.result('delete from reviews where book_id = $1', bookID)
        .then(db.result('delete from books where id = $1', bookID))
        .then(function (result) {
            /* jshint ignore:start */
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Removed book'
                });
            /* jshint ignore:end */
        })
        .catch(function (err) {
            return next(err);
        });
}

function getBooksOfAUser(req, res, next) {
  var profile_id = req.body.profile_id;
  db.task(function (t) {
    var q1 = t.any('select * from read_stats where profile_id = $1', [profile_id]);
    var q2 = t.any('select * from books where id IN(select book_id from read_stats ' +
      'where profile_id = $1)', [profile_id]);
    return t.batch([q1,q2]);
  })
/*  db.many('select * from read_stats where profile_id = $1', profile_id)*/
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          user_reading_info: data,
          message: 'Retrieved ONE read_stats'
        });
    })
    .catch(function (err) {
      console.log(err)
      return next(err);
    });

}

function updateUserStats(req, res, next){
  console.log(req.body)
  db.none('update read_stats set reading_status=$1 where book_id=$2 and profile_id=$3',
        [req.body.reading_status, req.body.book_id, req.body.profile_id])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Updated journey'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function createNote(req, res, next){
  console.log(req.body);
  var note = req.body;
  db.none('insert into notes(book_id, profile_id, dateedited, ' +
   'content, title, pageNum, paragraphNum, sentenceNum)' +
    'values($1, $2, $3, $4, $5, $6, $7, $8)',
    [note.book_id, note.profile_id, note.dateedited, 
    note.content, note.noteTitle, note.notePgNum, note.noteParaNum, note.noteSenNum ])
    .then(function(){
      res.status(200)
        .json({
          status: 'success',
          message: 'Created a new note'
        })
    })
    .catch(function(err){
      console.log(err);
      return next(err);
    })
}

function getNotes(req, res, next){
  db.any('select * from notes where book_id=$1 and profile_id=$2', 
    [req.params.id, req.query.profile_id])
    .then(function (data) {
          res.status(200)
              .json({
                  status: 'success',
                  data: data,
                  message: 'Get notes'
              });
      })
      .catch(function (err) {
          return next(err);
      });
}

function editNote(req, res, next) {
  console.log(req.body);
  var note = req.body;
  db.none('update notes set content=$1, dateedited=$2, title=$3, ' + 
    'pageNum=$4, paragraphNum=$5, sentenceNum=$6 where note_id=$7',
      [note.content, note.dateedited, note.noteTitle, note.notePgNum, 
      note.noteParaNum ,note.noteSenNum, req.params.id])
      .then(function () {
          res.status(200)
              .json({
                  status: 'success',
                  message: 'Updated note'
              });
      })
      .catch(function (err) {
          return next(err);
      });
}

function deleteNote(req, res, next){
  db.result('delete from notes where note_id = $1', req.params.id)
        .then(function (result) {
            /* jshint ignore:start */
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Deleted note'
                });
            /* jshint ignore:end */
        })
        .catch(function (err) {
            return next(err);
        });
}

function createWord(req, res, next){
  console.log(req.body)
  var word = req.body;
  db.none('insert into words(book_id, profile_id, dateedited, definition)' +
    'values($1, $2, $3, $4)',
    [word.book_id, word.profile_id, word.dateedited, word.definition])
    .then(function(){
      res.status(200)
        .json({
          status: 'success',
          message: 'Created a new word'
        })
    })
    .catch(function(err){
      console.log(err);
      return next(err);
    })
}

function getWords(req, res, next){
  db.any('select * from words where book_id=$1 and profile_id=$2', 
    [req.params.id, req.query.profile_id])
    .then(function (data) {
          res.status(200)
              .json({
                  status: 'success',
                  data: data,
                  message: 'Get words'
              });
      })
      .catch(function (err) {
        return next(err);
      });
}

function deleteWord(req, res, next){
  db.result('delete from words where word_id = $1', req.params.id)
        .then(function (result) {
            /* jshint ignore:start */
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Deleted words'
                });
            /* jshint ignore:end */
        })
        .catch(function (err) {
            return next(err);
        });
}

function getWordDef(req, res, next){
  axios.get(`${OXFORD_DIC_URL}/${req.params.word}`, {
    headers: {
      app_id: OXFORD_APP_ID,
      app_key: OXFORD_APP_KEY
    }
  }).then(function (response) {
    res.status(200)
      .json({
          status: 'success',
          data: response.data.results,
          message: 'Get word definition'
      });
  })
  .catch(function (error) {
    if (error.response.status === 404){
      res.status(404).json({
        status: 'failure',
        message: 'No Def Found'
      })
    } 
    console.log(error);
    return next(error);
  });
}

function searchWords(req, res, next){

  if (!req.body.word) res.end("req.body.word is null")
  db.any("SELECT * FROM dictionary WHERE word ~ $1", '^(' + req.body.word + ').*')
    .then((data) => {
      res.status(200)
              .json({
                  status: 'success',
                  data: data,
                  message: 'searched words!'
              });
      })
      .catch(function (err) {
        console.log(err)
        return next(err);
      });

}