
const crypto = require('crypto');
const mysql = require('mysql');
const dotenv = require('dotenv');


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



function hash(text, secret) {
    // Uses sha-256 has function to output a 64-char hash

	return crypto.createHmac('sha256', secret).update(text).digest('hex');

}

function genSessionKey() {
    // generatees a 128-char random hex string

	const size = 128;

	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

}

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

module.exports = {

    dbUsername,
    dbPassword,
    dbName,
    dbPort,
    secret,
    serverPort,
    hash,
    genSessionKey,
    query

};