
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
        const invalidPasswordHash = hash('y', secret);
        const sessionKey2 = genSessionKey();

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

        }).then(() => query(`

            SET @wasSuccess = FALSE;

            CALL LOGIN ('${invalidUsername}', '${passwordHash}', '${sessionKey2}', @wasSuccess);

            SELECT @wasSuccess AS wasSuccess;

            SET @existsSessionKey = (
                EXISTS (
                    SELECT AgentUsername
                    FROM SESSION_KEY
                    WHERE AgentUsername = '${invalidUsername}' AND SessionKey = '${sessionKey2}'
                )
            );

            SELECT @existsSessionKey AS existsSessionKey;

        `)).then(result => {
            /*

            User with invalid username, but correct password tries to login

            User should not be able to login.

            */

            const wasSuccess = result[2][0].wasSuccess;
            const existsSessionKey = result[4][0].existsSessionKey;

            expect(wasSuccess).toEqual(0);
            expect(existsSessionKey).toEqual(0);

        }).then(() => query(`

            SET @wasSuccess = FALSE;

            CALL LOGIN ('${username}', '${invalidPasswordHash}', '${sessionKey2}', @wasSuccess);

            SELECT @wasSuccess AS wasSuccess;

            SET @existsSessionKey = (
                EXISTS (
                    SELECT AgentUsername
                    FROM SESSION_KEY
                    WHERE AgentUsername = '${username}' AND SessionKey = '${sessionKey2}'
                )
            );

            SELECT @existsSessionKey AS existsSessionKey;

        `)).then(result => {
            /*

            User with valid username, but invalid password tries to login

            User should not be able to login.

            */

            const wasSuccess = result[2][0].wasSuccess;
            const existsSessionKey = result[4][0].existsSessionKey;

            expect(wasSuccess).toEqual(0);
            expect(existsSessionKey).toEqual(0);

        });

    });

    test('LIKE_POST', () => {

        const username = 'jonathan';
        const passwordHash = hash('benson', secret);
        const sessionKey = genSessionKey();

        const invalidUsername = "x";
        const invalidSessionKey = genSessionKey();

        const postTitle = 'Post_Title';

        return query(`

            INSERT INTO AGENT (Username, PasswordHash)
            VALUES ('${username}', '${passwordHash}');

            INSERT INTO SESSION_KEY (AgentUsername, SessionKey)
            VALUES ('${username}', '${sessionKey}');

            INSERT INTO POST (Title)
            VALUES ('${postTitle}');

            CALL LIKE_POST ('${username}', '${sessionKey}', '${postTitle}');

            SET @existsLike = (
                EXISTS (
                    SELECT AgentUsername
                    FROM POST_LIKE
                    WHERE AgentUsername = '${username}' AND PostTitle = '${postTitle}'
                )
            );

            SELECT @existsLike AS existsLike;

        `).then(result => {
            /*

            Valid user likes a post.

            A new like should be inserted into the database.

            */

            const existsLike = result[5][0].existsLike;

            expect(existsLike).toEqual(1);

        }).then(() => query(`

            CALL LIKE_POST ('${username}', '${sessionKey}', '${postTitle}');

            SELECT AgentUsername, PostTitle
            FROM POST_LIKE
            ORDER BY AgentUsername ASC;

        `)).then(result => {
            /*

            Valid user likes the same post a second time.

            There should be no changes to the database.

            */

            const expectedLikes = [
                {
                  AgentUsername: 'jonathan',
                  PostTitle: 'Post_Title'
                }
            ];

            const likes = result[1];

            expect(likes).toEqual(expectedLikes);


        }).then(() => query(`

            CALL LIKE_POST ('${invalidUsername}', '${sessionKey}', '${postTitle}');

            SET @existsLike = (
                EXISTS (
                    SELECT AgentUsername
                    FROM POST_LIKE
                    WHERE AgentUsername = '${invalidUsername}' AND PostTitle = '${postTitle}'
                )
            );

            SELECT @existsLike AS existsLike;

        `)).then(result => {
            /*

            Invalid user with valid session key tries to like a post.

            No new like should be inserted into the database.

            */

            const existsLike = result[2][0].existsLike;

            expect(existsLike).toEqual(0);

        }).then(() => query(`

            DELETE FROM POST_LIKE;

            CALL LIKE_POST ('${username}', '${invalidSessionKey}', '${postTitle}');

            SET @existsLike = (
                EXISTS (
                    SELECT AgentUsername
                    FROM POST_LIKE
                    WHERE AgentUsername = '${username}' AND PostTitle = '${postTitle}'
                )
            );

            SELECT @existsLike AS existsLike;

        `)).then(result => {
            /*

            Valid user with invalid session key tries to like a post.

            No new like should be inserted into the database.

            */

            const existsLike = result[3][0].existsLike;

            expect(existsLike).toEqual(0);

        });

    });

    test('COMMENT_POST', () => {

        const comment = "this is a comment";
        const secondComment = "this is another comment";

        const username = 'jonathan';
        const passwordHash = hash('benson', secret);
        const sessionKey = genSessionKey();

        const invalidUsername = "x";
        const invalidSessionKey = genSessionKey();

        const postTitle = 'Post_Title';

        return query(`

            INSERT INTO AGENT (Username, PasswordHash)
            VALUES ('${username}', '${passwordHash}');

            INSERT INTO SESSION_KEY (AgentUsername, SessionKey)
            VALUES ('${username}', '${sessionKey}');

            INSERT INTO POST (Title)
            VALUES ('${postTitle}');

            CALL COMMENT_POST ('${username}', '${sessionKey}', '${postTitle}', '${comment}');

            SELECT AgentUsername, PostTitle, PostComment
            FROM POST_COMMENT
            ORDER BY AgentUsername;

        `).then(result => {
            /*

            Valid user with valid session key comments on a post.

            New post should be inserted into database for the correct post.

            */

            const expectedPosts = [
                {
                  AgentUsername: 'jonathan',
                  PostTitle: 'Post_Title',
                  PostComment: 'this is a comment'
                }
              ];

            const posts = result[4];

            expect(posts).toEqual(expectedPosts);

        }).then(() => query(`

            CALL COMMENT_POST ('${username}', '${sessionKey}', '${postTitle}', '${secondComment}');

            SELECT AgentUsername, PostTitle, PostComment
            FROM POST_COMMENT
            ORDER BY AgentUsername;

        `)).then(result => {
            /*

            Valid user with valid session key comments on a post a second time (different comment).

            New post should be inserted into database for the correct post.

            */

            const expectedPosts = [
                {
                  AgentUsername: 'jonathan',
                  PostTitle: 'Post_Title',
                  PostComment: 'this is a comment'
                },
                {
                  AgentUsername: 'jonathan',
                  PostTitle: 'Post_Title',
                  PostComment: 'this is another comment'
                }
              ];

            const posts = result[1];

            expect(posts).toEqual(expectedPosts);

        }).then(() => query(`

            DELETE FROM POST_COMMENT;

            CALL COMMENT_POST ('${invalidUsername}', '${sessionKey}', '${postTitle}', '${comment}');

            SELECT AgentUsername, PostTitle, PostComment
            FROM POST_COMMENT
            ORDER BY AgentUsername;

        `)).then(result => {
            /*

            Invalid user with valid session key tries to comment on a post.

            No comment should be inserted.

            */

            const expectedPosts = [];

            const posts = result[2];

            expect(posts).toEqual(expectedPosts);

        }).then(() => query(`

            CALL COMMENT_POST ('${username}', '${invalidSessionKey}', '${postTitle}', '${comment}');

            SELECT AgentUsername, PostTitle, PostComment
            FROM POST_COMMENT
            ORDER BY AgentUsername;

        `)).then(result => {
            /*

            Valid user with invalid session key tries to comment on a post.

            No comment should be inserted.

            */

            const expectedPosts = [];

            const posts = result[1];

            expect(posts).toEqual(expectedPosts);

        });

    });


});


