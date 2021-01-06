const mysql = require('mysql');

var connectionPool = mysql.createPool({
    connectionLimit: 8,
    host: process.env.DATABASE_HOSTNAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
    debug: false
});


module.exports = connectionPool;