const router = require('express').Router();
const xss = require('xss'); //used for cleaning user input
const pool = require('../config/mysqlConnector'); //connection pool


/**
 * Gets all the invites a user has
 * 
 * @param {String} userUUID
 */
router.route('/getInvites').get((req, res) => {
    const cleanUserUUID = xss(req.query.userUUID);

    let inputs = [cleanUserUUID];

    pool.getConnection((error, connection) => {
        if (error) console.log('Error: ' + error);
        else {
            connection.query("SELECT invite_id, repo_id FROM user_repo_invites WHERE invited_id = (SELECT user_id FROM user WHERE user.userUUID = ?)",
                inputs, (error, results, fields) => {
                    if (error) res.status(400).json(error);
                    else res.json(results);
                })
        }

        connection.release();

    })
})

/**
 * Invites a specified username to a specified repo IF inviter is owner
 * 
 * @param {String} userUUID //the inviter
 * @param {Integer} repoId
 * @param {String} username //the invited
 * @param {Boolean} canUpload
 * @param {Boolean} canDeleteImg
 * @param {Boolean} canRenameRepo
 * @param {Boolean} canDeleteRepo
 */
router.route('/inviteUser').post((req, res) => {

    //remove xss attack possibility
    const cleanUserUUID = xss(req.body.userUUID); //for inviter_id
    const cleanRepoId = xss(req.body.repoId); //repo being invited to
    const cleanUserName = xss(req.body.username); //username of the invited

    //Not checking if they are booleans; if error, transaction will fail in procedure b/c expecting tinyint(1)
    const cleanCanUpload = (xss(req.body.canUpload) == 'true' ? 1 : 0);
    const cleanCanDeleteImg = xss(req.body.canDeleteImg) == 'true' ? 1 : 0;
    const cleanCanRenameRepo = xss(req.body.canRenameRepo) == 'true' ? 1 : 0;
    const cleanCanDeleteRepo = xss(req.body.canDeleteRepo) == 'true' ? 1 : 0;

    /**
     * First check if repo is public and if inviter is owner
     * If not, exit
     * 
     * Then check if invite to that user to this repo already exists
     * If so, exit
     * 
     * Then create new invite with inputted permissions
     */

    let inputs = [cleanUserUUID, cleanUserName, cleanRepoId, cleanCanUpload, cleanCanDeleteImg, cleanCanRenameRepo, cleanCanDeleteRepo];


    pool.getConnection((error, connection) => {
        if (error) console.log('Error: ' + error);
        else {
            connection.query("CALL inviteUser(?, ?, ?, ?, ?, ?, ?)",
                inputs, (error, results, fields) => {
                    if (error) res.status(400).json(error);
                    else res.json("Success!");
                })
        }

        connection.release();

    })
});

router.route('/acceptInvite').post((req, res) => {

    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoId = xss(req.body.repoId);
    const cleanInviteId = xss(req.body.inviteId)

    let inputs = [cleanInviteId, cleanUserUUID, cleanRepoId];
    pool.getConnection((error, connection) => {

        if (error) console.log('Error: ' + error);
        else {
            //make them send in invite id, userUUID, and repoID to authenticate its not just a modified REST request 

            /**
             * gets userID using UUID. Checks if there is a row in invites for the input information; if so, removes the row and 
             * gives user the permissions specified in the row
             */

            connection.query("CALL acceptInvite(?, ?, ?)",
                inputs,
                (error, results, fields) => {
                    if (error) res.status(400).json(error);
                    else res.json("success");
                })


        }


        connection.release();
    })
})



module.exports = router