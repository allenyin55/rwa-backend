DROP DATABASE IF EXISTS books;
CREATE DATABASE books;

\c books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR,
  bookInfo JSONB,
  dateAdded timestamp
);

CREATE TABLE reviews(
    review_id serial PRIMARY KEY NOT NULL,
    book_id int4 REFERENCES books(id),
    dateEdited timestamp,
    reviewer text,
    review text
);




INSERT INTO books(title, bookInfo, dateAdded)
  VALUES ('The power of habit','{"title": "The Power of Habit", "author":"Allen" }',CURRENT_TIMESTAMP);

INSERT INTO reviews(book_id, dateEdited, reviewer, review)
  VALUES (1, CURRENT_TIMESTAMP,'I love this book', 'Annie');

INSERT INTO reviews(book_id, dateEdited, reviewer, review)
  VALUES (1, CURRENT_TIMESTAMP, 'this is anther review','FunBros')