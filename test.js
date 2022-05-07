
const {
	
    secret,
    hash,
    genSessionKey,
    query

} = require('./server_helper');


describe('stored procedures', () => {

    beforeEach(() => query('CALL CLEAN ()'));
    afterAll(() => query('CALL CLEAN ()'));

    test('first test', () => {

        expect(true).toEqual(true);

    });

});


