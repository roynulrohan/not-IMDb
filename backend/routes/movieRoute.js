const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');

// middleware to lowercase query params for case insensitive matching
router.use(function (req, res, next) {
    for (var key in req.query) {
        req.query[key.toLowerCase()] = req.query[key];
    }
    next();
});

router.route('/').get(function (req, res) {
    const {
        search,
        title,
        genre,
        year,
        minImdbRating,
        minMetascore,
        actor,
        type,
    } = req.query;
    let query = {};

    if (title) {
        query.Title = { $regex: title, $options: 'i' };
    }

    if (genre) {
        query.Genre = { $regex: genre, $options: 'i' };
    }

    if (year) {
        query.Year = year;
    }

    if (minImdbRating) {
        query.imdbRating = { $gt: minImdbRating };
    }

    if (minMetascore) {
        query.Metascore = { $gt: minMetascore };
    }

    if (actor) {
        query.Actors = { $regex: actor, $options: 'i' };
    }

    if (type) {
        query.Type = type;
    }

    console.log(query);
    if (search) {
        Movie.aggregate(
            [
                { $match: query },
                {
                    $match: {
                        $or: [
                            { Title: { $regex: search, $options: 'i' } },
                            { Genre: { $regex: search, $options: 'i' } },
                            { Actors: { $regex: search, $options: 'i' } },
                            { Year: { $regex: search, $options: 'i' } },
                        ],
                    },
                },
                { $sample: { size: 40 } },
            ],
            function (err, movies) {
                if (err) {
                    console.log(err);
                } else {
                    res.json(movies);
                }
            }
        );
    } else {
        Movie.aggregate(
            [{ $match: query }, { $sample: { size: 40 } }],
            function (err, movies) {
                if (err) {
                    console.log(err);
                } else {
                    res.json(movies);
                }
            }
        );
    }
});

router.route('/movie/').get(function (req, res) {
    Movie.count().exec(function (err, count) {
        // Get a random entry
        let random = Math.floor(Math.random() * count);

        Movie.findOne()
            .skip(random)
            .exec(function (err, movie) {
                res.json(movie);
            });
    });
});

router.route('/movie/:id').get(function (req, res) {
    let id = req.params.id;

    Movie.findById(id, function (err, movie) {
        res.json(movie);
    });
});

router.route('/:ids').get(function (req, res) {
    let ids = req.params.ids;

    ids = ids.split(',');

    ids.pop();

    Movie.find({ _id: { $in: ids } }, function (err, movies) {
        if (err) {
            console.log(err);
        } else {
            res.json(movies);
        }
    });
});

module.exports = router;
