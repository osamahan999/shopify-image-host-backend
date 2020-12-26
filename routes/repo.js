const router = require('express').Router();

const xss = require('xss'); //used for cleaning user input
const pool = require('../config/mysqlConnector'); //connection pool



/**
 * Renames repo if individual making the request has the correct permissions
 * 
 * @param {String} userUUID
 * @param {Int} repoId
 * @param {String} newRepoName
 */
router.route('/renameRepo').post((req, res) => {
    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoId = xss(req.body.repoId);
    const cleanNewRepoName = xss(req.body.newRepoName);

    pool.getConnection((error, connection) => {
        if (error) res.status.json("Error connecting");
        else {

            connection.query("CALL renameRepo(?, ?, ?)",
                [cleanUserUUID, cleanRepoId, cleanNewRepoName],
                (error, results, fields) => {
                    if (error) res.status(400).json("Error: you may not have permissions to do that");
                    else {
                        res.json("Success");
                    }
                });
        }
    })


})





/**
 * Checks if user in the repo or if they can even delete
 * If so, removes repo and deletes all user permissions for that repo
 * 
 * @param {String} userUUID
 * @param {Int} repoID
 */
router.route('/deleteRepo').post((req, res) => {

    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoID = xss(req.body.repoID);


    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error connecting to database");
        else {
            connection.query("SELECT * FROM user_repository_permissions WHERE (repo_id = ?) AND (user_id = (SELECT user_id FROM user WHERE user.userUUID = ?) )",
                [cleanRepoID, cleanUserUUID],
                (error, results, fields) => {
                    if (error) res.status(400).json("Error: Something failed.");
                    else {
                        if (results[0].canDeleteRepo) {
                            //only removing people's permissions because i want to keep their data
                            connection.query("DELETE FROM user_repository_permissions WHERE repo_id = ?", [cleanRepoID], (error, results, fields) => {
                                if (error) res.status(400).json('Error: ' + error);
                                else {
                                    res.json("Repo deleted");
                                }
                            })
                        } else {
                            res.status(400).json("You don't have those permissions");
                        }
                    }

                })
        }

        connection.release();

    })


})

/**
 * Gets an individuals repos
 * 
 * @param {String} userUUID
 */
router.route('/getRepos').get((req, res) => {
    const cleanUserUUID = xss(req.query.userUUID);


    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error connecting to database");
        else {


            connection.query("SELECT name, repo_id FROM repository NATURAL JOIN user_repository_permissions " +
                "WHERE (user_repository_permissions.user_id = (SELECT user_id FROM user WHERE user.userUUID = ?)) ORDER BY date_created DESC",
                cleanUserUUID, (error, results, fields) => {
                    if (error) res.status(400).json("Error occured database-side");
                    else res.json(results);
                })
        }

        connection.release();

    })
})


/**
 * Gets the images in a specific repo. Any person with any permissions in a repo can view the images.
 * @param {String} userUUID
 * @param {Int} repoID
 */
router.route('/getRepoImages').get((req, res) => {
    const cleanRepoId = xss(req.query.repoID);
    const cleanUserUUID = xss(req.query.userUUID);

    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error connecting to database");
        else {

            connection.query("CALL getRepoImages(?, ?)",
                [cleanRepoId, cleanUserUUID], (error, results, fields) => {
                    if (error) res.status(400).json("Error retrieving repo images");
                    else {
                        if (results[0].length == undefined) res.json([results[0]]);
                        else res.json(results[0]);
                    }
                })
        }

        connection.release();

    })
})

/**
 * The procedure from getRepos, except I am building the query based on however many tags are input, and whether the images match those tags vaguely
 * 
 * @param {String} userUUID
 * @param {Int} repoID
 * @param {Array<String>} tags
 */
router.route('/getRepoImagesFiltered').get((req, res) => {
    const cleanRepoID = xss(req.query.repoID);
    const cleanUserUUID = xss(req.query.userUUID);

    const cleanTags = xss(req.query.tags).replace(/\s/g, ""); //clean tags and remove all whitespace
    const tagsArray = cleanTags.split(",");
    let inputs = [cleanRepoID];

    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error connecting to database");
        else {

            connection.query("SELECT COUNT(*) AS 'rows' FROM user_repository_permissions WHERE user_id = " +
                "(SELECT user_id FROM user WHERE (user.userUUID = ?) AND repo_id = ?)",
                [cleanUserUUID, cleanRepoID], (error, results, field) => {
                    if (error) res.status(400).json("Error database-side ");
                    else {
                        if (results[0].rows > 0) {
                            let query = "SELECT image_url.url, image_url.image_id, image_url.image_text AS title, tag.tag_text AS tags FROM image_url " +
                                "NATURAL JOIN img_in_repo NATURAL JOIN img_has_tag NATURAL JOIN tag " +
                                "WHERE (img_in_repo.repo_id = ?) AND (image_url.url IS NOT NULL AND image_url.url != '')";
                            let wildCardSearch = "";

                            if (tagsArray.length != 0) {
                                query += " AND ( (tag.tag_text LIKE CONCAT('%', ?, '%'))  ";
                                inputs.push(tagsArray[0]);

                                for (let i = 1; i < tagsArray.length; i++) {
                                    wildCardSearch += " OR (tag.tag_text LIKE CONCAT('%', ?, '%')  ";
                                    inputs.push(tagsArray[i]);
                                }
                                query += ")"
                            }

                            query = query + wildCardSearch + " GROUP BY image_url.image_id ORDER BY image_url.date_uploaded DESC";


                            connection.query(query, inputs, (error, results, field) => {
                                if (error) res.status(400).json('Error database-side ');
                                else {
                                    res.json(results);

                                }
                            })
                        }
                    }
                }
            )

        }

        connection.release();

    })
})


/**
 * Creates a repo and gives user owner permissions
 * 
 * @param {String} userUUID
 * @param {String} repoName
 * @param {String} publicRepo //comes in as String due to REST
 */
router.route('/newRepo').post((req, res) => {


    //remove xss attack possibility
    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoName = xss(req.body.repoName);
    const cleanPublicRepo = xss(req.body.publicRepo);


    if (cleanUserUUID.length < 1 || cleanRepoName.length < 1) res.json("failed");
    else {

        //Boolean input comes in as String, need to change it to 1 or 0 based on value
        var public = 0;
        if (cleanPublicRepo == 'true') public = 1;

        //gets connection from pool
        pool.getConnection((error, connection) => {
            if (error) console.log('Error connecting to database ');
            else {
                connection.query("CALL newRepo(?, ?, ?)", [cleanUserUUID, cleanRepoName, public],
                    (error, results, fields) => {
                        if (error) res.status(400).json("Error creating new repo");
                        else res.json("Success!");
                    })
            }

            connection.release();

        })


    }


});



module.exports = router