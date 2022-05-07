
const express = require('express');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

/*

.env file should have the following variables defined:

DB_USERNAME
DB_PASSWORD
DB_NAME
PORT


*/

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const port = process.env.PORT;

console.log("DB_USERNAME: " + dbUsername);
console.log("DB_PASSWORD: " + dbPassword);
console.log("DB_NAME: " + dbName);
console.log("DB_PORT: " + port + "\n\n");

app.get('/', (req, res) => {
	res.send("Hello World!");
})

app.listen(port, () => {
	console.log(`App listening on port ${port}...`)
})




