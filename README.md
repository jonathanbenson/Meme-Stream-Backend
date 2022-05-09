# Meme-Stream-Backend

Back-end complement to android application: https://github.com/jonathanbenson/Meme-Stream-Android-App

## Environment Variables
Define the following variables in `.env` file in project directory
- `DB_USERNAME` -> username of database user
- `DB_PASSWORD` -> password of database user
- `DB_NAME` -> name of the MySQL database
- `DB_PORT` -> database port
- `SECRET` -> a secret key that is factored into the hashing of passwords
- `SERVER_PORT` -> port that the server listens on for requests

## Build and Run
- Make sure the `init.sql` script is run through MySQL before server startup
- To install dependencies run the command `npm install`
- To run enter `npm start`

## Testing
To run tests enter `npm test`
