
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

    test("AUTHENTICATE_AGENT", () => {

        const username = 'jonathan';
        const passwordHash = hash('benson', secret);
        const sessionKey = genSessionKey();

        const invalidUsername = 'x';
        const invalidSessionKey = genSessionKey();

        return query(`

            INSERT INTO AGENT (Username, PasswordHash)
            VALUES ('${username}', '${passwordHash}');

            SET @isAuthenticated = FALSE;

            CALL AUTHENTICATE_AGENT ('${username}', '${sessionKey}', @isAuthenticated);

            SELECT @isAuthenticated AS isAuthenticated;

        `).then(result => {
            /*

            Try to authenticate a user that has been created, but has no session key yet.

            User should be denied authentication.

            */

            const isAuthenticated = result[3][0].isAuthenticated;

            expect(isAuthenticated).toEqual(0);

        }).then(() => query(`

            INSERT INTO SESSION_KEY (SessionKey, AgentUsername)
            VALUES ('${sessionKey}', '${username}');

            SET @isAuthenticated = FALSE;

            CALL AUTHENTICATE_AGENT ('${username}', '${sessionKey}', @isAuthenticated);

            SELECT @isAuthenticated AS isAuthenticated;

        `)).then(result => {
            /*

            After inserting new SESSION_KEY record for the user, the user should now be authenticated.

            */

            const isAuthenticated = result[3][0].isAuthenticated;

            expect(isAuthenticated).toEqual(1);

        }).then(() => query(`

            SET @isAuthenticated = FALSE;

            CALL AUTHENTICATE_AGENT ('${username}', '${invalidSessionKey}', @isAuthenticated);

            SELECT @isAuthenticated AS isAuthenticated;

        `)).then(result => {
            /*

            Try to authenticate valid user with invalid session key.

            User should be denied authentication.

            */

            const isAuthenticated = result[2][0].isAuthenticated;

            expect(isAuthenticated).toEqual(0);

        }).then(() => query(`

            SET @isAuthenticated = FALSE;

            CALL AUTHENTICATE_AGENT ('${invalidUsername}', '${sessionKey}', @isAuthenticated);

            SELECT @isAuthenticated AS isAuthenticated;

        `)).then(result => {
            /*

            Try to authenticate invalid username with valid session key.

            User should be denied authentication.

            */

            const isAuthenticated = result[2][0].isAuthenticated;

            expect(isAuthenticated).toEqual(0);

        });


    });

    test('LOGIN', () => {
        
        const username = 'jonathan';
        const passwordHash = hash('benson', secret);
        const sessionKey = genSessionKey();

        const invalidUsername = "x";
        const invalidPassword = hash('y', secret);

        return query(`

            INSERT INTO AGENT (Username, PasswordHash)
            VALUES ('${username}', '${passwordHash}');

            SET @wasSuccess = FALSE;

            CALL LOGIN ('${username}', '${passwordHash}', '${sessionKey}', @wasSuccess);

            SELECT @wasSuccess AS wasSuccess;

            SET @existsSessionKey = (
                EXISTS (
                    SELECT AgentUsername
                    FROM SESSION_KEY
                    WHERE AgentUsername = '${username}' AND SessionKey = '${sessionKey}'
                )
            );

            SELECT @existsSessionKey AS existsSessionKey;

        `).then(result => {
            /*

            Valid user tries to login with correct credentials.

            A new session key should be generated for the user and the login should be successful.

            */

            const wasSuccess = result[3][0].wasSuccess;
            const existsSessionKey = result[5][0].existsSessionKey;

            expect(wasSuccess).toEqual(1);
            expect(existsSessionKey).toEqual(1);

        });

    });


});


