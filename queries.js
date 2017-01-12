var promise = require('bluebird');

var options = {
    // Initialization Options
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var cn = {
    host:"ec2-54-163-225-208.compute-1.amazonaws.com",
    port: 5432,
    database: 'd99m473ab6h247',
    user: 'kbatncdacntkir',
    password: '646fe6cb14b266c3704173da5a243abc07439f8068ad618486665285ea231bc2',
    ssl: true
};
var db = pgp(cn);

// add query functions

module.exports = {
    getAllBooks: getAllBooks,
    getSingleBook: getSingleBook,
    createBook: createBook,
    addAReview: addAReview,
    editReview: editReview,
    deleteReview: deleteReview,
    removeBook: removeBook
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
    db.many('select * from books where id = $1', bookID)
        .then(function (book) {
            db.many('select * from reviews where book_id = $1', bookID)
                .then(function (reviews) {
                    console.log(reviews[0].dateedited   )
                    res.status(200)
                        .json({
                            status: 'success',
                            book: book,
                            reviews: reviews,
                            message: 'Retrieved ONE book'
                        });
                })
        })
        .catch(function (err) {
            return next(err);
        });
}

function createBook(req, res, next) {
    db.one('insert into books(title, bookInfo, dateAdded)' +
        'values($1, $2, $3  ) returning id',
        [req.body.title, req.body.bookInfo, req.body.dateAdded])
        .then( function (data) {
            db.none('insert into reviews(book_id, review, reviewer, dateEdited)' +
                'values($1, $2, $3, $4)',
                [data.id, req.body.review, req.body.reviewer, req.body.dateEdited])
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

function editReview(req, res, next) {
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
