
const express = require('express');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

/*

.env file should have the following variables defined:

DB_USERNAME
DB_PASSWORD
DB_NAME
DB_PORT


*/

const port = process.env.DB_PORT;

app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




