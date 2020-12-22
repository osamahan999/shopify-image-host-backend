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

const uploadImage = (file) => new Promise((resolve, reject) => {

    const { originalname, buffer } = file

    const blob = filesBucket.file(originalname.replace(/ /g, "_"))
    const blobStream = blob.createWriteStream({
        resumable: false
    })

    blobStream.on('finish', () => {
        const publicUrl = format(
            `https://storage.googleapis.com/${filesBucket.name}/${blob.name}`
        );
        console.log(publicUrl);
        resolve(publicUrl);
    })
        .on('error', () => {
            reject(`Unable to upload image, something went wrong`)
        })
        .end(buffer)


}).catch((error) => {
    reject(`Unable to upload image, something went wrong`);
})

router.route('/uploadImage').post(async (req, res, next) => {
    try {
        const myFile = req.file

        const imageUrl = await uploadImage(myFile);

        res.json({
            message: "Upload was successful",
            data: imageUrl
        })
    } catch (error) {
        next(error);
        res.status(400).json(error);
    }

});



module.exports = router