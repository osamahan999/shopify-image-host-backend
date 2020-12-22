const express = require('express')
const app = express();
const cors = require("cors");


const multer = require('multer');
const bodyParser = require('body-parser');


app.use(cors());
app.use(express.json());

const port = process.env.PORT || 6000;


const multerMid = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})

app.disable('x-powered-by');
app.use(multerMid.single('file'));
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



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

