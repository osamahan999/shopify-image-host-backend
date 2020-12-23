
const router = require('express').Router();
const Cloud = require('@google-cloud/storage');
const path = require("path");
const util = require('util')
const xss = require('xss'); //used for cleaning user input

const pool = require('../config/mysqlConnector'); //connection pool



const serviceKey = path.join(__dirname, '../config/key.json');
const bucketname = 'shopify-image-repo-bucket';

const { Storage } = Cloud

const multer = require('multer');
const { createConnection } = require('net');
const { clearInterval } = require('timers');

const gc = new Storage({
    keyFilename: 'config/key.json',
    projectId: 'shopifyimagerepo'
})
const filesBucket = gc.bucket(bucketname);




const upload = multer({ dest: 'uploads/' });


/**
 * routes to /uploadImages, and uploads up to 6 files at once. async of course
 */
router.post('/uploadImages', upload.array('files', 6), async (req, res) => {
    try {

        const myFile = req.files;
        let imageUrls = [];

        const cleanUserUUID = xss(req.body.userUUID);
        const cleanRepoID = xss(req.body.repoID);

        //clean and format tags
        let tags = (req.body.tags.split(","));
        const cleanTags = tags.map((tag) => xss(tag.trim()));

        for (let i = 0; i < req.files.length; i++) {
            myFile[i].originalname = xss(myFile[i].originalname); //sanitize file name

            let jsonImageInfo = await uploadImageToCloud(myFile[i]);


            const cleanUrl = xss(jsonImageInfo.url); // despite it coming from google might as well clean it incase they get breached lmfao
            const cleanText = (jsonImageInfo.imageName); //cleaned alrdy



            //first we check if user has permissions to add images to repo

            //if they do, then we insert image into image_url table

            //then we get the image id and insert the tags for that image into the db.

            //then we add image to repo


            pool.getConnection((error, connection) => {
                if (error) console.log('Error: ' + error);
                else {
                    /**
                     * What this does is check if
                     * A. The user has permissions to add images to this repo
                     * B. If the image url is already posted to this repo. We don't want duplicates for ease of storage i'm on a free plan LOL
                     */
                    connection.query("SELECT * FROM user_repository_permissions " +
                        " WHERE (user_id= (SELECT user_id FROM user WHERE userUUID = ? ) AND repo_id = ?) AND " +
                        " (? NOT IN (SELECT url FROM image_url NATURAL JOIN img_in_repo WHERE img_in_repo.repo_id = ?))",
                        [cleanUserUUID, cleanRepoID, cleanUrl, cleanRepoID], //input fields, written this way to prevent injection attacks
                        (error, results, fields) => {

                            if (error) console.log('Error: ' + error);

                            else if (results.length == 0) console.log("You don't have permission to do that");
                            else {
                                if (results[0].canUpload) {
                                    connection.query("CALL insertImage(?, ?, ?)",
                                        [cleanUrl, cleanText, cleanRepoID], (error, results, fields) => {
                                            if (error) console.log('Error: line 90 ' + error);
                                            else {

                                                //now insert tags
                                                if (tags.length != 0) {

                                                    let query = "INSERT IGNORE INTO tag (tag_text, date_created) VALUES (?)";
                                                    let values = ", (?)"

                                                    for (let i = 0; i < cleanTags.length - 1; i++) query += values; //iterate length - 1 b/c we alrdy have the (?)
                                                    connection.query(query, cleanTags, (error, results, fields) => {
                                                        if (error) console.log('Error: ' + error);
                                                        else {

                                                            //url is unique per repo so this gives 1 image id
                                                            let getImgID = "(SELECT image_id FROM img_in_repo NATURAL JOIN image_url WHERE image_url.url = ? ))";
                                                            let getTagID = "(SELECT tag_id FROM tag WHERE tag_text = ?)";

                                                            let values = ", (" + getImgID + ", " + getTagID + ")";

                                                            let query = "INSERT INTO img_has_tag (image_id, tag_id) VALUES (" + getImgID + ", " + getTagID + ")";

                                                            let queryInputs = [];
                                                            queryInputs.push(cleanUrl, cleanTags[0]);

                                                            for (let i = 1; i < cleanTags.length; i++) {
                                                                query += values; //iterate length - 1 b/c we alrdy have the initial val
                                                                queryInputs.push(cleanUrl, cleanTags[i]);
                                                            }

                                                            connection.query(query, queryInputs, (error, results, fields) => {
                                                                if (error) console.log('Error: ' + error);
                                                            })


                                                        }
                                                    })
                                                }
                                            }
                                        }
                                    )


                                } else {
                                    console.log("You do not have permissions to do that");
                                }

                            }

                        })
                }


                connection.release();

            })

            imageUrls.push(jsonImageInfo);

        }


        res.json(jsonImageInfo);


    } catch (error) {
        res.json(error);
    }

});




/**
 * Takes in a file, and returns a json with the name of the file and the URL
 * @param {File object} file 
 */
function uploadImageToCloud(file) {
    return (new Promise((resolve, reject) => {
        const { originalname, buffer } = file;
        const blob = filesBucket.file(originalname.replace(/ /g, "_"));
        const blobStream = blob.createWriteStream({
            resumable: false
        });


        blobStream.on('finish', () => {
            const url = "https://storage.googleapis.com/" + filesBucket.name + "/" + blob.name;

            resolve(url);
        }).on('error', () => {
            reject(`Unable to upload image, something went wrong`)
        }).end(buffer)

    }).then((url) => {
        return ({ imageName: file.originalname, url: url });


    }).catch((error) => console.log(error))
    );
}



module.exports = router