const express = require('express')
const app = express();
const cors = require("cors");


const multer = require('multer');
const bodyParser = require('body-parser');


app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;


app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));




//initialize connection pool
var pool = require('./config/mysqlConnector');



const userRouter = require("./routes/user");
const imageRouter = require("./routes/image");
const repoRouter = require("./routes/repo");


app.use("/user", userRouter);
app.use("/image", imageRouter);
app.use("/repo", repoRouter);

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



