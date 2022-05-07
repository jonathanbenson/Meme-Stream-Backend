
const mysql = require('mysql');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());

dotenv.config();

/*

.env file should have the following variables defined:

DB_USERNAME
DB_PASSWORD
DB_NAME
DB_PORT
SECRET
SERVER_PORT


*/

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPort = process.env.DB_PORT;
const secret = process.env.SECRET;
const serverPort = process.env.SERVER_PORT;

console.log("DB_USERNAME: " + dbUsername);
console.log("DB_PASSWORD: " + dbPassword);
console.log("DB_NAME: " + dbName);
console.log("DB_PORT: " + dbPort);
console.log("SECRET: " + secret);
console.log("SERVER_PORT: " + serverPort + "\n\n");


app.get('/', (req, res) => {
	res.send("Hello World!");
});

app.get('/post/:title/:fileExt', (req, res) => {

	const filePath = path.join(__dirname, 'content', `${req.params.title}.${req.params.fileExt}`);

	if (fs.existsSync(filePath))
		res.sendFile(filePath);
	else
		res.send("Could not load content");

});

app.get('/register/:username/:password', (req, res) => {

	return query(`

		SET @message = "";

		CALL CREATE_AGENT ('${req.params.username}', '${hash(req.params.password)}', @message);

		SELECT @message as message;

	`).then(result => {

		res.json(result);

	});

});

app.get('/login/:username/:password', (req, res) => {

	return query(`

		SET @wasSuccess = FALSE;

		CALL LOGIN ('${req.params.username}', '${hash(req.params.password)}', '${genSessionKey()}', @wasSuccess);

		SELECT @wasSuccess AS wasSuccess;

	`).then(result => {

		res.json(result);

	});

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

function hash(text) {

	return crypto.createHmac('sha256', secret).update(text).digest('hex');

}

function genSessionKey() {

	const size = 128;

	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

}