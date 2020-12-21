const router = require('express').Router();

const crypto = require('crypto'); //used for generating salt
const xss = require('xss'); //used for cleaning user input
const pool = require('../mysqlConnector'); //connection pool





/**
 * SHA256 hash using salt

 * @param {16 byte random string} salt 
 * @param {user input password} pwd 
 */
const hashPassword = (salt, pwd) => {
    const hash = crypto.createHash('sha256');

    pwd = hash.update(salt + pwd).digest('hex');
    hash.end();

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

        connection.query("SELECT salt, password, user_id FROM user WHERE username = ?",
            cleanUserName, //input fields, written this way to prevent injection attacks
            (error, results, fields) => {
                if (error) res.status(400).json('Error: ' + error);


                if (results[0].password == hashPassword(results[0].salt, cleanPassword)) res.json({ user_id: results[0].user_id });
                else res.status(400).json('Error: ' + error);

            })

        connection.release();

    })



});


/**
 * Registers a user
 * @param {String} username
 * @param {String} password
 * @param {String} email
 * @param {String} firstName //OPTIONAL
 * @param {String} lastName //OPTIONAL  TODO FIX 
 */
router.route('/userRegister').post((req, res) => {


    //remove xss attack possibility
    const cleanUserName = xss(req.body.username);
    const cleanPassword = xss(req.body.password);
    const cleanEmail = xss(req.body.email);
    const cleanFirstName = xss(req.body.firstName);
    const cleanLastName = xss(req.body.lastName);

    // randomly generated salt
    const salt = crypto.randomBytes(16).toString('hex');

    //has pw with random salt
    const hashedPassword = hashPassword(salt, cleanPassword);


    //gets connection from pool
    pool.getConnection((error, connection) => {
        if (error) res.status(400).json('Error: ' + error);

        //check for unique username
        connection.query("SELECT * FROM user WHERE username = ?", cleanUserName, (error, results, fields) => {

            if (error) res.status(400).json('Error: ' + error);

            //if unique
            else if (results.length == 0) {

                var insertQuery = "INSERT INTO user (first_name, last_name, email, username, password, date_created, salt) " +
                    "VALUES (? , ? , ? , ? , ? , NOW() , ? )";

                connection.query(insertQuery, [cleanFirstName, cleanLastName, cleanEmail, cleanUserName, hashedPassword, salt], (error, results, fields) => {
                    if (error)
                        res.status(400).json('Error: ' + error);

                    res.json("Successful register");
                })


            } else {
                res.status(400).json("Not Unique");
            }
            connection.release();

        })
    })
});



module.exports = router