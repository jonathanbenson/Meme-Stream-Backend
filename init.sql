
DROP DATABASE IF EXISTS MEMESTREAM;
CREATE DATABASE MEMESTREAM;

USE MEMESTREAM;

CREATE TABLE AGENT (
	-- Typical user account with username and password
    
	Username VARCHAR(16) PRIMARY KEY NOT NULL UNIQUE,

    -- Uses the SHA-256 algorithm
    PasswordHash CHAR(64) NOT NULL
    
);

CREATE TABLE SESSION_KEY (
	-- Authentication for users when they login and interact with the app
    
	SessionKey CHAR(128) PRIMARY KEY NOT NULL UNIQUE,
	AgentUsername VARCHAR(16) NOT NULL
    
);

CREATE TABLE POST (
	-- Table to keep track of posts
    -- The actual post content will be kept in the android app
	Title VARCHAR(32) PRIMARY KEY NOT NULL UNIQUE
    
);

CREATE TABLE POST_LIKE (
	-- A user can like a post, and this table keeps track of those likes
    
	AgentUsername VARCHAR(16) NOT NULL UNIQUE,
    PostTitle VARCHAR(32) NOT NULL UNIQUE,
    
    PRIMARY KEY (AgentUsername, PostTitle),
    FOREIGN KEY (AgentUsername) REFERENCES AGENT (Username),
    FOREIGN KEY (PostTitle) REFERENCES POST (Title)
    
);


CREATE TABLE POST_COMMENT (
	-- A user can comment on a post, and this table keeps track of those comments
    
	AgentUsername VARCHAR(16) NOT NULL,
    PostTitle VARCHAR(32) NOT NULL,
    PostComment VARCHAR(512) NOT NULL,
    
    FOREIGN KEY (AgentUsername) REFERENCES AGENT (Username),
    FOREIGN KEY (PostTitle) REFERENCES POST (Title)
    
);

DELIMITER $$

CREATE PROCEDURE INIT ()
BEGIN
	-- Initializes the database with stock content
    
	INSERT INTO POST (Title) VALUES ("a1");
	INSERT INTO POST (Title) VALUES ("a2");
	INSERT INTO POST (Title) VALUES ("a3");
	INSERT INTO POST (Title) VALUES ("a4");
	INSERT INTO POST (Title) VALUES ("a5");
	INSERT INTO POST (Title) VALUES ("a6");
    
END $$

CREATE PROCEDURE CLEAN ()
BEGIN
	-- Resets the database between tests

	SET FOREIGN_KEY_CHECKS = 0;

	DELETE FROM POST_COMMENT;
    DELETE FROM POST_LIKE;
    DELETE FROM POST;
    DELETE FROM SESSION_KEY;
    DELETE FROM AGENT;
    
    SET FOREIGN_KEY_CHECKS = 1;

END $$

CREATE PROCEDURE CREATE_AGENT (IN agentUsername VARCHAR(16), IN passwordHash CHAR(64), OUT wasSuccess BOOL)
BEGIN
    /*

    Stored procedure to create a new agent (user) in the database.

    */

	-- check if the user already exists in the databsase
	IF (NOT EXISTS (SELECT Username FROM AGENT WHERE Username = agentUsername)) THEN
    BEGIN
    
		-- if the user does not exist in the database
        -- then insert the new user into the database
		INSERT INTO AGENT (Username, PasswordHash)
        VALUES (agentUsername, passwordHash);
    
		SET wasSuccess = TRUE;
    
    END;
    ELSE
    BEGIN
		
        -- if the user already exists in the database
        -- then output an error message
        SET wasSuccess = FALSE;
        
    END;
    END IF;

END $$

CREATE PROCEDURE AUTHENTICATE_AGENT (IN agentName VARCHAR(16), IN sKey CHAR(128), OUT isValid BOOL)
BEGIN
    /*

    Stored procedure to check if there is an entry in SESSION_KEY with the AgentUsername and SessionKey of
    those provided as arguments.

    */

	-- if there is not a match, then the user is not authenticated
	SET isValid = FALSE;
    
    -- check if there is an entry in SESSION_KEY where the username and session key match those provided
    IF (EXISTS (SELECT AgentUsername FROM SESSION_KEY WHERE AgentUsername = agentName AND SessionKey = sKey)) THEN
    BEGIN
    
		-- if there is a match, then the user is authenticated
		SET isValid = TRUE;
    
    END;
    END IF;

END $$

CREATE PROCEDURE LOGIN (IN agentName VARCHAR(16), IN passHash CHAR(64), IN newSessionKey CHAR(128), OUT wasSuccess BOOL)
BEGIN
	/*
    
    Stored procedure to login a user.
    
    */

	SET wasSuccess = FALSE;
    
    -- Check if the user has correct username and password
	IF (EXISTS (SELECT Username FROM AGENT WHERE Username = agentName AND PasswordHash = passHash)) THEN
    BEGIN
        
        -- check if the user is already logged in (probably from another machine somewhere)
        IF (EXISTS (SELECT SessionKey FROM SESSION_KEY WHERE AgentUsername = agentName)) THEN
        BEGIN
        
			-- if the user is already logged in
            -- then update the session key to the newly generated key
			UPDATE SESSION_KEY
            SET SessionKey = newSessionKey
            WHERE AgentUsername = agentName;
        
        END;
        ELSE
        BEGIN
            
            -- if the user is not already logged in
            -- then give the user a new session key (new record in SESSION_KEY)
			INSERT INTO SESSION_KEY (SessionKey, AgentUsername)
            VALUES (newSessionKey, agentName);
        
        END;
        END IF;
		
		SET wasSuccess = TRUE;
        
    END;
    END IF;

END $$

CREATE PROCEDURE LIKE_POST (IN agentName VARCHAR(16), IN sessionKey CHAR(128), IN pTitle VARCHAR(32))
BEGIN
	/*
    
    Inserts a new record into POST_LIKE with the agent's username and post title
    ... provided that the user has not already liked the post.
    
    */

	SET @isAuthenticated = FALSE;
    
    CALL AUTHENTICATE_AGENT (agentName, sessionKey, @isAuthenticated);
    
    IF (@isAuthenticated AND NOT EXISTS (SELECT AgentUsername FROM POST_LIKE WHERE AgentUsername = agentName AND PostTitle = pTitle)) THEN
    BEGIN
    
		INSERT INTO POST_LIKE (AgentUsername, PostTitle)
        VALUES (agentName, pTitle);
    
    END;
    END IF;

END $$

CREATE PROCEDURE COMMENT_POST (IN agentName VARCHAR(16), IN sessionKey CHAR(128), IN pTitle VARCHAR(32), IN newComment VARCHAR(512))
BEGIN
	/*
    
    Inserts a new record into POST_COMMENT with the agent's username and post title
    ... a user can comment as many times on a post as they want
    
    */

	SET @isAuthenticated = FALSE;
    
    CALL AUTHENTICATE_AGENT (agentName, sessionKey, @isAuthenticated);
    
    IF (@isAuthenticated) THEN
    BEGIN
    
		INSERT INTO POST_COMMENT (AgentUsername, PostTitle, PostComment)
        VALUES (agentName, pTitle, newComment);
    
    END;
    END IF;

END $$


DELIMITER ;



