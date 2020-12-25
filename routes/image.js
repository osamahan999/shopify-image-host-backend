
const router = require('express').Router();
const Cloud = require('@google-cloud/storage');
const path = require("path");
const util = require('util')
const xss = require('xss'); //used for cleaning user input
const multer = require('multer');
var fs = require('fs');
const pool = require('../config/mysqlConnector'); //connection pool
const mkdirp = require("mkdirp");

const serviceKey = path.join(__dirname, '../config/key.json');
const bucketname = 'shopify-image-repo-bucket';

const { Storage } = Cloud

const gc = new Storage({
    keyFilename: 'config/key.json',
    projectId: 'shopifyimagerepo'
})
const filesBucket = gc.bucket(bucketname);


var storage = multer.diskStorage({
    destination: function (_req, file, done) {
        const tag = file.originalname.split("-");

        const dir = path.join(__dirname + "/upload", ...tag.slice(0, tag.length - 1));
        mkdirp.sync(dir);

        return done(null, dir);
    },
    filename: function (_req, file, done) {
        const filename = file.originalname.substr(file.originalname.lastIndexOf("-") + 1);
        return done(null, filename);
    }
});




router.post('/deleteImageFromRepo', (req, res) => {
    const cleanUserUUID = xss(req.body.userUUID);
    const cleanRepoId = xss(req.body.repoId);

    const imagesToRemove = req.body.imagesToRemove;
    if (imagesToRemove.length == 0) res.status(400).json("No images selected");
    else {


        var imageIdsToDelete = [];

        for (var i = 0; i < imagesToRemove.length; i++) {
            imageIdsToDelete.push(xss(imagesToRemove[i]));
        }

        pool.getConnection((error, connection) => {
            if (error) res.status(400).json('Error: ' + error);
            else {
                /**
                 * Check if user is in this repo
                 */

                connection.query("SELECT * FROM user_repository_permissions " +
                    "WHERE user_id = (SELECT user_id FROM user WHERE user.userUUID = ?) AND repo_id = ?", [cleanUserUUID, cleanRepoId],
                    (error, results, fields) => {
                        if (error) res.status(400).json('Error');
                        else {
                            if (results[0].canDeleteImg == 1) { //if can delete
                                let inputs = [cleanRepoId];
                                inputs.push(imageIdsToDelete[0]);
                                let query = "DELETE FROM img_in_repo WHERE ( repo_id = ? ) AND (image_id IN (? ";

                                for (let i = 1; i < imageIdsToDelete.length; i++) {
                                    inputs.push(imageIdsToDelete[i]);
                                    query += ", ?"
                                }
                                query += "))"


                                connection.query(query, inputs, (error, results, fields) => {
                                    if (error) res.status(400).json(error);
                                    else {
                                        res.json("removed");
                                    }
                                })
                            } else res.status(400).json("You dont have permissions to do that");
                        }
                    })
            }


            connection.release();

        })
    }

})








const upload = multer({ storage });
/**
 * routes to /uploadImages, and uploads up to 20 files at once. async of course
 * Calls uploadImageToCloud on each image, to upload to google cloud 
 */
router.post('/uploadImages', upload.array('files', 20), async (req, res) => {
    try {

        const myFile = req.files;
        let imageUrls = [];

        const cleanUserUUID = xss(req.body.userUUID);
        const cleanRepoID = xss(req.body.repoID);



        const cleanTags = xss(req.body.tags).replace(/\s/g, ""); //clean tags and remove all whitespace

        for (let i = 0; i < req.files.length; i++) {
            myFile[i].originalname = xss(myFile[i].originalname); //sanitize file name


            let jsonImageInfo = await uploadImageToCloud(req.files[i]);


            const cleanUrl = xss(jsonImageInfo.url); // despite it coming from google might as well clean it incase they get breached lmfao
            const cleanText = xss(jsonImageInfo.imageName);

            const inputArr = [cleanUrl, cleanText, cleanRepoID, cleanUserUUID, cleanTags];



            pool.getConnection((error, connection) => {
                if (error) console.log('Error: ' + error);
                else {
                    /**
                     * What this precedure does is check if
                     * A. The user has permissions to add images to this repo 
                     * B. If the image url is already posted to this repo. We don't want duplicates for ease of storage i'm on a free plan LOL
                     * C. Adds image to image_url if does not exist
                     * D. Adds img_in_repo 
                     * E1. Checks to see if each tag is in the database -> if so, gets tag and adds to img_has_tag
                     * E2. If tag nonexistant, adds it to tag table and then adds new tag id and img id to img_has_tag
                     * F. Checks if any errors occured; if so, rollback: else, we're good!
                     */


                    connection.query("CALL d9794gvvb8r68jpf.insertImage(?, ?, ?, ?, ?)", inputArr,
                        (error, results, fields) => {
                            if (error) res.status(400).json('Error: ' + error);
                            else {

                                res.json("Success");

                            }
                        })
                }



                connection.release();
            })

            imageUrls.push(jsonImageInfo);

        }



    } catch (error) {
        res.json(error);
    }

    //TODO: delete upload folder but might not be an issue when hosted on cloud



});






/**
 * Takes in a file, and returns a json with the name of the file and the URL
 * @param {File object} file 
 */
function uploadImageToCloud(file) {
    return (new Promise((resolve, reject) => {
        const { originalname } = file;
        const buffer = fs.readFileSync(file.path);

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