var promise = require('bluebird');

var options = {
    // Initialization Options
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
/*var cn = {
    host:"ec2-54-163-225-208.compute-1.amazonaws.com",
    port: 5432,
    database: 'd99m473ab6h247',
    user: 'kbatncdacntkir',
    password: '646fe6cb14b266c3704173da5a243abc07439f8068ad618486665285ea231bc2',
    ssl: true
};*/
var cn = {
  host: "localhost",
  port:5432,
  database: "books",
  user: "Allen",
  password: "yhn960716"
};

var db = pgp(cn);

// add query functions

module.exports = {
  getAllBooks: getAllBooks,
  getSingleBook: getSingleBook,
  createBook: createBook,
  createJourney: createJourney,
  addAReview: addAReview,
  addComment: addComment,
  editReview: editReview,
  deleteReview: deleteReview,
  removeBook: removeBook,
  getBooksOfAUser: getBooksOfAUser

};

function getAllBooks(req, res, next) {
    db.any('select * from books')
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL books'
                });
        })
        .catch(function (err) {
            console.log(err);
            return next(err);
        });
}

function getSingleBook(req, res, next) {
    var bookID = parseInt(req.params.id);
    console.log(req.params.id)
    db.one('select * from books where id = $1', bookID)
        .then(function (book) {
            db.any('select * from reviews where book_id = $1', bookID)
                .then(function (reviews) {
                  console.log(reviews);
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
  db.task(function (t) {
    return t.any('insert into books(title, bookInfo, dateAdded) select $1, $2, $3 where ' +
      'not exists (select title from books where title = $1) returning id;' +
      'select id from books where title = $1',
      [req.body.title, req.body.bookInfo, req.body.dateAdded])
      .then(function (data) {
        return t.none('insert into reviews(book_id, review, reviewer, dateEdited)' +
          'values($1, $2, $3, $4)',
          [data[0].id, req.body.review, req.body.reviewer, req.body.dateEdited])
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
      return next(err);
    });
}

function createJourney(req, res, next) {
  db.task(function (t) {
    return t.any('insert into books(title, bookInfo, dateAdded) select $1, $2, $3 where ' +
      'not exists (select title from books where title = $1) returning id;' +
      'select id from books where title = $1',
      [req.body.title, req.body.bookInfo, req.body.dateAdded])
      .then(function(data) {
        return t.any('insert into read_stats(book_id, profile_id, note, "startingDate", initial_feeling,' +
          'final_feeling,reading_status, finalReview,recommend)' +
          'select $1, $2, $3, $4, $5, $6, $7, $8, $9 where not exists (select book_id, profile_id from ' +
          'read_stats where book_id = $1 and profile_id = $2) returning id;' +
          'select id from read_stats where book_id = $1',
          [data[0].id, req.body.profile_id, req.body.note, req.body.startingDate,parseInt(req.body.initial_feeling),
            parseInt(req.body.final_feeling), parseInt(req.body.reading_status), req.body.finalReview, req.body.recommend])
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

function addAReview(req, res, next) {
    db.none('insert into reviews(book_id, review, reviewer, dateEdited)'+
            'values($1, $2, $3, $4)',
        [parseInt(req.params.id), req.body.review, req.body.reviewer, req.body.dateEdited ])
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

function addComment(req, res, next){

}

function editReview(req, res, next) {
    console.log(req.body)
    db.none('update reviews set review=$1, reviewer=$2, dateEdited=$3 where review_id=$4',
        [req.body.review, req.body.reviewer, req.body.dateEdited, req.body.review_id])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Updated review'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function deleteReview(req, res, next) {
  console.log(req.body)
    db.result('delete from reviews where review_id = $1', req.body.review_id)
        .then(function (result) {
          console.log(result)
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
  console.log("req.body", req.body)
  var profile_id = req.body.profile_id;
  db.tx(function (t) {
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
