const bodyParser = require('body-parser');
const express = require('express')
const cors = require("cors");

require('dotenv').config();


//initialize connection pool
var pool = require('./config/mysqlConnector');

pool.getConnection((error, connection) => {
    if (error) console.log(error)

    connection.query("SELECT * FROM user", [], (error, results, fields) => {
        if (error) console.log(error)
        console.log(results);
    })
})


// routes
const repoInvitesRouter = require("./routes/repoInvites");
const imageRouter = require("./routes/image");
const userRouter = require("./routes/user");
const repoRouter = require("./routes/repo");


const port = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.disable('x-powered-by');

app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/user", userRouter);
app.use("/image", imageRouter);
app.use("/repo", repoRouter);
app.use("/repoInvite", repoInvitesRouter);

app.get('/', (req, res) => {
    res.send("Deployed");
})

app.use((err, req, res, next) => {
    res.status(500).json({
        error: err,
        message: 'Internal server error!',
    })
    next()
})


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});



