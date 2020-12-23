const router = require('express').Router();

const xss = require('xss'); //used for cleaning user input
const pool = require('../config/mysqlConnector'); //connection pool






router.route('/deleteRepo').post((req, res) => {

    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoID = xss(req.body.repoID);

    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error: " + error);
        else {
            connection.query("SELECT * FROM user_repository_permissions WHERE repo_id = ? AND user_id = (SELECT user_id FROM user WHERE userUUID = ? )",
                [cleanRepoID, cleanUserUUID],
                (error, results, fields) => {
                    if (error) res.status(400).json('Error: ' + error);
                    else {
                        if (results[0].canDeleteRepo) {
                            connection.query("DELETE FROM user_repository_permissions WHERE repo_id = ?", [cleanRepoID], (error, results, fields) => {
                                if (error) res.status(400).json('Error: ' + error);
                                else {
                                    connection.query("DELETE FROM repository WHERE repo_id = ?  ", [cleanRepoID], (error, results, fields) => {
                                        if (error) res.status(400).json('Error: ' + error);
                                        else {
                                            res.json("Successfully deleted");
                                        }
                                    })
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

router.route('/getRepos').get((req, res) => {
    const cleanUserUUID = xss(req.query.userUUID);


    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error: " + error);
        else {


            connection.query("SELECT name, repo_id FROM repository WHERE (owner_id = (SELECT user_id FROM user WHERE userUUID = ?)) ORDER BY date_created DESC",
                cleanUserUUID, (error, results, fields) => {
                    if (error) res.status(400).json('Error: ' + error);
                    else res.json(results);
                })
        }

        connection.release();

    })
})

router.route('/getRepoImages').get((req, res) => {
    const cleanRepoId = xss(req.query.repoID);

    pool.getConnection((error, connection) => {
        if (error) res.status(400).json("Error: " + error);
        else {

            connection.query("CALL getRepoImages(?)",
                cleanRepoId, (error, results, fields) => {
                    if (error) res.status(400).json('Error: ' + error);
                    else {
                        console.log(results);
                        res.json(results[0]);
                    }
                })
        }

        connection.release();

    })
})


/**
 * Creates a repo and gives user owner permissions
 * 
 * @param {String} userUUID
 * @param {String} repoName
 * @param {Boolean} publicRepo
 */
router.route('/newRepo').post((req, res) => {


    //remove xss attack possibility
    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoName = xss(req.body.repoName);
    const cleanPublicRepo = xss(req.body.publicRepo);

    if (cleanUserUUID.length < 1 || cleanRepoName.length < 1) res.status(400).json("Invalid input");
    else {
        var public = false;
        if (cleanPublicRepo == true) public = true;
        //gets connection from pool
        pool.getConnection((error, connection) => {
            if (error) res.status(400).json('Error: ' + error);

            connection.query("SELECT * FROM repository WHERE owner_id = (SELECT user_id FROM user WHERE userUUID = ?) AND name = ?", [cleanUserUUID, cleanRepoName],
                (error, results, fields) => {
                    if (error) res.status(400).json('Error: ' + error);
                    else if (results.length > 0) {
                        res.status(400).json("Error: this exact repo already exists!");
                    } else {
                        connection.query("INSERT INTO repository (owner_id, date_created, name, public)" +
                            " VALUES ((SELECT user_id FROM user WHERE userUUID = ?), now(), ?, ? )",
                            [cleanUserUUID, cleanRepoName, public], (error, results, fields) => {

                                if (error) res.status(400).json('Error: ' + error);

                                //if unique
                                else {
                                    connection.query("INSERT INTO user_repository_permissions " +
                                        "(user_id, isOwner, canUpload, canDeleteImg, canRenameRepo, canDeleteRepo, repo_id)" +
                                        " VALUES ((SELECT user_id FROM user WHERE userUUID = ?), 1, 1, 1, 1, 1, (SELECT repo_id FROM repository WHERE owner_id = " +
                                        "(SELECT user_id FROM user WHERE userUUID = ?) AND name = ?))", [cleanUserUUID, cleanUserUUID, cleanRepoName], (error, results, fields) => {

                                            if (error) res.status(400).json('Error: ' + error);
                                            else res.json("Success");
                                        })
                                }
                                connection.release();

                            })
                    }
                })

        })
    }
});



module.exports = router