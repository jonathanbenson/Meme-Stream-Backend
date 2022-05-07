
const {
	
    secret,
    hash,
    genSessionKey,
    query

} = require('./server_helper');


describe('stored procedures', () => {

    // before each and after all tests clean the database
    beforeEach(() => query('CALL CLEAN ()'));
    afterAll(() => query('CALL CLEAN ()'));

    test('CREATE_AGENT', () => {

        const username = 'jonathan';
        const passwordHash = hash('benson', secret);

        return query(`

            SET @wasSuccess = FALSE;

            CALL CREATE_AGENT('${username}', '${passwordHash}', @wasSuccess);

            SELECT @wasSuccess AS wasSuccess;

            SELECT Username AS username, PasswordHash AS passwordHash
            FROM AGENT
            WHERE Username = '${username}' AND PasswordHash = '${passwordHash}'
            LIMIT 1;

        `).then(result => {
            /*

            Create a new user for the first time.

            Expect user to be inserted into the database, with no errors.

            */

            const wasSuccess = result[2][0].wasSuccess;
            const agentUsername = result[3][0].username;
            const agentPasswordHash = result[3][0].passwordHash;

            expect(wasSuccess).toEqual(1);
            expect(username).toEqual(agentUsername);
            expect(passwordHash).toEqual(agentPasswordHash);


        }).then(() => query(`

            SET @wasSuccess = FALSE;

            CALL CREATE_AGENT('${username}', '${passwordHash}', @wasSuccess);

            SELECT @wasSuccess AS wasSuccess;

        `)).then(result => {
            /*

            Try to create the same user a second time.

            Expect no changes to the database, and an error.

            */
           
            const wasSuccess = result[2][0].wasSuccess;
            
            expect(wasSuccess).toEqual(0);

        });

    });

});


