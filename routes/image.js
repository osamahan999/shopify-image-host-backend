const router = require('express').Router();
const Cloud = require('@google-cloud/storage');
const path = require("path");
const util = require('util')

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

const uploadImage = (async (file) => {
    new Promise((resolve, reject) => {

        const { originalname, buffer } = file

        const blob = filesBucket.file(originalname.replace(/ /g, "_"))
        const blobStream = blob.createWriteStream({
            resumable: false
        })

        blobStream.on('finish', () => {
            return "https://storage.googleapis.com/" + filesBucket.name + "/" + blob.name;

            resolve();
        }).on('error', () => {
            reject(`Unable to upload image, something went wrong`)
        }).end(buffer)

    })
})



router.route('/uploadImage').post(async (req, res, next) => {
    try {
        const myFile = req.file;

        new Promise((resolve, reject) => {
            const { originalname, buffer } = myFile;
            const blob = filesBucket.file(originalname.replace(/ /g, "_"))
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
            res.json({
                message: "upload was successful!",
                data: url
            });
        }).catch((error) => res.json(error));




    } catch (error) {
        return next(error);
    }

});



module.exports = router