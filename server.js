

const express = require('express');
const path = require('path');
const fs = require('fs');


const {
	
	dbUsername,
    dbPassword,
    dbName,
    dbPort,
    secret,
    serverPort,
    hash,
    genSessionKey,
    query

} = require('./server_helper');


const app = express();
app.use(express.json());



app.get('/', (req, res) => {
	res.send("Hello World!");
});

app.get('/posts', (req, res) => {

	return query(`

		SELECT Title AS title, FileExt AS ext
		FROM POST
		ORDER BY RAND();

	`).then(result => {

		res.json(result);

	});

});

app.get('/post/:title/:fileExt', (req, res) => {
	// Sends the content of a post to the client

	const filePath = path.join(__dirname, 'content', `${req.params.title}.${req.params.fileExt}`);

	if (fs.existsSync(filePath))
		res.sendFile(filePath);
	else
		res.send("Could not load content");

});

app.get('/register/:username/:password', (req, res) => {
	// Creates a new user in the database

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

// Logs a user into the database
// Resets their session key
app.get('/login/:username/:password', (req, res) => loginHelper(req, res));


app.listen(serverPort, () => {
	// Starts server listening
	console.log(`App listening on port ${serverPort}...`)

	return query('CALL CLEAN (); CALL INIT ();');
});


function loginHelper(req, res) {
	// Logs a user into the database
	// Resets their session key

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