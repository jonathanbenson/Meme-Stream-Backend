
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
    -- The actual post content will be kept in folder on the server
	Title VARCHAR(32) PRIMARY KEY NOT NULL UNIQUE,
    FileExt VARCHAR(4) NOT NULL
    
);

DELIMITER $$

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

CREATE PROCEDURE AUTHENTICATE_AGENT (IN agentUsername VARCHAR(16), IN sessionKey CHAR(128), OUT isValid BOOL)
BEGIN
    /*

    Stored procedure to check if there is an entry in SESSION_KEY with the AgentUsername and SessionKey of
    those provided as arguments.

    */

	-- if there is not a match, then the user is not authenticated
	SET isValid = FALSE;
    
    -- check if there is an entry in SESSION_KEY where the username and session key match those provided
    IF (EXISTS (SELECT AgentUsername FROM SESSION_KEY WHERE AgentUsername = agentUsername AND SessionKey = sessionKey)) THEN
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


INSERT INTO POST (Title, FileExt) VALUES ("Harry_Potter", "jpeg");
INSERT INTO POST (Title, FileExt) VALUES ("John_Wick", "jpg");
INSERT INTO POST (Title, FileExt) VALUES ("Pursuit_of_Depression", "jpeg");
INSERT INTO POST (Title, FileExt) VALUES ("Sick_Day", "jpg");
INSERT INTO POST (Title, FileExt) VALUES ("Sleepover", "jpg");
INSERT INTO POST (Title, FileExt) VALUES ("Year_2020", "jpeg");

