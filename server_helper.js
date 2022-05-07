
const crypto = require('crypto');

function hash(text, secret) {
    // Uses sha-256 has function to output a 64-char hash

	return crypto.createHmac('sha256', secret).update(text).digest('hex');

}

function genSessionKey() {
    // generatees a 128-char random hex string

	const size = 128;

	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

}

module.exports = {

    hash,
    genSessionKey

};