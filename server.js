
const mysql = require('mysql');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');


const {hash, genSessionKey} = require('./server_helper');



const app = express();
app.use(express.json());

dotenv.config();

/*

.env file should have the following variables defined:

DB_USERNAME -> username of database user
DB_PASSWORD -> password of database user
DB_NAME -> name of the MySQL database
DB_PORT -> database port
SECRET -> a secret key that is factored into the hashing of passwords
SERVER_PORT -> port that the server listens on for requests


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

		SET @wasSuccess = FALSE;

		CALL CREATE_AGENT ('${req.params.username}', '${hash(req.params.password, secret)}', @wasSuccess);

		SELECT @wasSuccess AS wasSuccess;

	`).then(result => {

		const wasSuccess = result[2][0].wasSuccess;

		if (wasSuccess)
			return loginHelper(req, res);
		else
			res.json({status: 0, key: null});

	});

});

app.get('/login/:username/:password', (req, res) => loginHelper(req, res));

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



function loginHelper(req, res) {

	return query(`

		SET @wasSuccess = FALSE;

		CALL LOGIN ('${req.params.username}', '${hash(req.params.password, secret)}', '${genSessionKey()}', @wasSuccess);

		SELECT @wasSuccess AS wasSuccess;

		SELECT SessionKey AS sessionKey
		FROM SESSION_KEY
		WHERE AgentUsername = '${req.params.username}'
		LIMIT 1;

	`).then(result => {
		
		const wasSuccess = result[2][0].wasSuccess;
		const sessionKey = result[3][0].sessionKey;

		if (wasSuccess)
			res.json({status: wasSuccess, key: sessionKey});
		else
			res.json({status: wasSuccess, key: null});

	});

}