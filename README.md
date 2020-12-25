Frontend repository with a much more indepth readme about the project @https://github.com/osamahan999/shopify-image-host-frontend

To run this, you must either: 
Simply navigate to the hosted version @https://shopifyimagerepofrontend.uc.r.appspot.com/ 


or set up on your own machine by following these steps: 

1. Clone the repo from my github 
2. remove all node modules if they give you any trouble and do the following:
    1. npm init 
    2. npm install express 
    3. npm install xss 
    4. npm install @google-cloud/storage 
    5. npm install mysql 
    6. npm install body-parser 
    7. npm install --save multer 
    8. Set up a google cloud bucket and fill in the bucket info in repo.js 
    9. Link your key.json file to the correct import in repo.js 
    10. Set up a mysqlConnection file which simply specifies a connection pool using whatever hosting service you're using 
3. If backend runs fine, then no need to remove the node modules.
4. Set up a google cloud bucket for your images
5. Set up a heroku MySQL database
6. Import my database schemas and procedures from the databaseSchema folder
7. Set up the frontend and point the http requests towards your local host



