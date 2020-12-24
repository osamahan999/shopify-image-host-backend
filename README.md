To run this, you must either: \n
Simply navigate to the hosted version @putlinkhere \n

or set up on your own machine by following these steps: \n

1. Clone the repo from my github \n
2. remove all node modules \n
3. npm init \n
4. npm install express \n
5. npm install xss \n
6. npm install @google-cloud/storage \n
7. npm install mysql \n
8. npm install body-parser \n
9. npm install --save multer \n
10. Set up a google cloud bucket and fill in the bucket info in repo.js \n
11. Link your key.json file to the correct import in repo.js \n
12. Set up a mysqlConnection file which simply specifies a connection pool using whatever hosting service you're using \n
\n
13. Clone my frontend repo, follow the readme, and change all http requests to your host\n



\n\n\n\n
Some issues I need to work on: \n
1. Make it such that duplicate URLs do not simply get reinputted into the db, but instead 
are pulled and referenced to, and that only img_in_repo table has new values inserted \n
2. Sometimes the cloud server simply does not work? Throws a 500 code and I have no clue why. My best guess is 
the free plan assumes you won't use it often, and so I get the connection turned off to save them costs? \n
3. Sometimes the sql server turns off, and takes a bit for the connection to reconnect. Again, free plan :( \n