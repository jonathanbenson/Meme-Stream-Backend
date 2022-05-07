
const express = require('express');
const dotenv = require('dotenv');
const app = express();
const path = require('path');

dotenv.config();

/*

.env file should have the following variables defined:

DB_USERNAME
DB_PASSWORD
DB_NAME
DB_PORT
SERVER_PORT


*/

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPort = process.env.DB_PORT;
const serverPort = process.env.SERVER_PORT;

console.log("DB_USERNAME: " + dbUsername);
console.log("DB_PASSWORD: " + dbPassword);
console.log("DB_NAME: " + dbName);
console.log("DB_PORT: " + dbPort);
console.log("SERVER_PORT: " + serverPort + "\n\n");

app.get('/', (req, res) => {
	res.send("Hello World!");
});

app.get('/post/:title/:fileExt', (req, res) => {

	res.sendFile(path.join(__dirname, 'content', `${req.params.title}.${req.params.fileExt}`));

});




app.listen(serverPort, () => {
	console.log(`App listening on port ${serverPort}...`)
});


function query(text) {
	/*

	Queries the database. Returns any rows that are retrieved from a SELECT statement.

	*/

	return new Promise((resolve, reject) => {

		let connection = mysql.createConnection({
 
			host: "localhost",
			user: dbUsername,
			password: dbPassword,
			database: dbName,
			port: dbPort,
			multipleStatements: true
		 
		});

		connection.connect();

		connection.query(
			text,

			function(error, results, fields) {

				connection.end();

				if (error) return reject(error);

				return resolve(results);

			});

		});

}

