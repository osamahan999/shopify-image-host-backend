const router = require('express').Router();

const crypto = require('crypto'); //used for generating salt
const xss = require('xss'); //used for cleaning user input
const pool = require('../config/mysqlConnector'); //connection pool





/**
 * SHA256 hash using salt

 * @param {16 byte random string} salt 
 * @param {user input password} pwd 
 */
const hash = (salt, pwd) => {
    const hashAlgo = crypto.createHash('sha256');

    pwd = hashAlgo.update(salt + pwd).digest('hex');
    hashAlgo.end();

    return pwd;

}


/**
 * Logs in the user and returns their user id
 * 
 * params {username, password}
 */
router.route('/userLogIn').post((req, res) => {
    const cleanUserName = xss(req.body.username);
    const cleanPassword = xss(req.body.password);

    pool.getConnection((error, connection) => {
        if (error) res.status(400).json('Error: ' + error);

        connection.query("SELECT salt, password, userUUID FROM user WHERE username = ?",
            cleanUserName, //input fields, written this way to prevent injection attacks
            (error, results, fields) => {
                if (error) res.status(400).json("Log in failed");

                if (results.length == 0) res.status(400).json("Check your log in information");
                else if (results[0].password == hash(results[0].salt, cleanPassword)) res.json({ userUUID: results[0].userUUID });
                else res.status(400).json("Check your log in information");

            })

        connection.release();

    })



});


/**
 * Registers a user
 * @param {String} username
 * @param {String} password
 * @param {String} email
 * @param {String} firstName 
 * @param {String} lastName  
 */
router.route('/userRegister').post((req, res) => {


    //remove xss attack possibility
    const cleanUserName = xss(req.body.username);
    const userUUID = hash("", xss(req.body.username)); //used as a login verification in frontend rather than returning userID
    const cleanPassword = xss(req.body.password);
    const cleanEmail = xss(req.body.email);
    const cleanFirstName = xss(req.body.firstName);
    const cleanLastName = xss(req.body.lastName);

    if (cleanFirstName.length < 1 || cleanLastName.length < 1 || cleanEmail.length < 1) res.status(400).json("Invalid input");
    else {
        // randomly generated salt
        const salt = crypto.randomBytes(16).toString('hex');

        //has pw with random salt
        const hashedPassword = hash(salt, cleanPassword);


        //gets connection from pool
        pool.getConnection((error, connection) => {
            if (error) res.status(400).json('Error: ' + error);
            else {
                //check for unique username
                connection.query("SELECT * FROM user WHERE username = ?", cleanUserName, (error, results, fields) => {

                    if (error) res.status(400).json('Error: ' + error);

                    //if unique
                    else if (results.length == 0) {

                        var insertQuery = "INSERT INTO user (first_name, last_name, email, username, password, date_created, salt, userUUID) " +
                            "VALUES (? , ? , ? , ? , ? , NOW() , ?, ? )";

                        connection.query(insertQuery,
                            [cleanFirstName, cleanLastName, cleanEmail, cleanUserName, hashedPassword, salt, userUUID],
                            (error, results, fields) => {
                                if (error)
                                    res.status(400).json('Error: ' + error);

                                res.json("Successful register");
                            })


                    } else {
                        res.status(400).json("Not Unique");
                    }

                })
            }

            connection.release();

        })
    }
});



module.exports = router