const express = require('express')
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

//initialize connection pool
var pool = require('./mysqlConnector');



const userRouter = require("./routes/user");
const imageRouter = require("./routes/image");


app.use('/user', userRouter);
app.use("/image", imageRouter);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

