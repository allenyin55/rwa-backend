CREATE TABLE read_stats(
  id SERIAL PRIMARY KEY,
  note text,
  startingDate timeStamp,
  finishingDate timestamp,
  initial_feeling int,
  final_feeling int,
  reading_status int4,
  finalReview text,
  recommend bool,
  book_id int4 REFERENCES books(id),
  profile_id numeric
);

CREATE TABLE comments(
    comment_id serial PRIMARY KEY NOT NULL,
    review_id int4,
    parentComment_id int4,
    dateEdited timestamp,
    commentContent text,
    commenter text
);



INSERT INTO read_stats(note,startingDate,initial_feeling,final_feeling,reading_status, finalReview,recommend)
  VALUES ('my first note',CURRENT_TIMESTAMP, 1, 2, 3, 'this is good', true);

INSERT INTO comments(review_id, dateEdited, commentContent, commenter) VALUES (1, CURRENT_TIMESTAMP, 'this is a comment','FunBros');