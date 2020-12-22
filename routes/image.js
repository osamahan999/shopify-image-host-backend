
const router = require('express').Router();
const Cloud = require('@google-cloud/storage');
const path = require("path");
const util = require('util')
const xss = require('xss'); //used for cleaning user input



const serviceKey = path.join(__dirname, '../config/key.json');
const bucketname = 'shopify-image-repo-bucket';

const { Storage } = Cloud

const multer = require('multer');
const { resolve } = require('path');

const multerMid = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
})

const gc = new Storage({
    keyFilename: 'config/key.json',
    projectId: 'shopifyimagerepo'
})
const filesBucket = gc.bucket(bucketname);



// const imageStorage = multer.diskStorage({
//     destination(req, file, cb) {
//         cb(null, "../uploads")
//     }
// })

const upload = multer({ dest: 'uploads/' });


/**
 * routes to /uploadImages, and uploads up to 6 files at once. async of course
 */
router.post('/uploadImages', upload.array('files', 6), async (req, res) => {
    try {

        const myFile = req.files;
        let imageUrls = [];

        for (let i = 0; i < req.files.length; i++) {
            myFile[i].originalname = xss(myFile[i].originalname); //sanitize file name

            let jsonImageInfo = await uploadImageToCloud(myFile[i]);

            //adds json objects to array for each file
            imageUrls.push(jsonImageInfo);

        }



        res.json(imageUrls);

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