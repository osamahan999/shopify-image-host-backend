Frontend repository with a much more indepth readme about the project @https://github.com/osamahan999/shopify-image-host-frontend

To run this, you must either: 
Simply navigate to the hosted version @https://shopifyimagerepofrontend.uc.r.appspot.com/ 


or set up on your own machine by following these steps: 

1. Clone the repo from my github 
2. npm install
3. Set up a google cloud bucket for your images
4. Insert the key.json file into shopify-image-host-backend/config as key.json
5. Set up a heroku MySQL database
6. Initialize the .env file with your database information and port.
7. Import my database schemas and procedures from the databaseSchema folder
8. Set up the frontend and point the http requests towards your local host (currently pointing at production endpoints)



