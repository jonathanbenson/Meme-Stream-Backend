
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
    -- The keys will expire after a certain amount of time being inactive
    
	SessionKey CHAR(128) PRIMARY KEY NOT NULL UNIQUE,
	AgentUsername VARCHAR(16) NOT NULL,
    LastUpdated TIMESTAMP NOT NULL
    
);

CREATE TABLE POST (
	-- Table to keep track of posts
    -- The actual post content will be kept in folder on the server
	Title VARCHAR(32) PRIMARY KEY NOT NULL UNIQUE
    
);

CREATE TABLE POST_RATING (
	-- Ratings by users on posts
    
	AgentUsername VARCHAR(16) NOT NULL,
    PostTitle VARCHAR(32) NOT NULL,
    
    -- Users can rate a post as 1 (like) or -1 (dislike)
    Rating INT NOT NULL CHECK(Rating = -1 OR Rating = 1),
    
    -- A user can only rate the post once (but can update their one rating later)
    PRIMARY KEY (AgentUsername, PostTitle),
    FOREIGN KEY (AgentUsername) REFERENCES AGENT (Username),
    FOREIGN KEY (PostTitle) REFERENCES POST (Title)
    
);

DELIMITER $$

CREATE PROCEDURE CREATE_AGENT (IN agentUsername VARCHAR(16), IN passwordHash CHAR(64), OUT message VARCHAR(32))
BEGIN

	-- check if the user already exists in the databsase
	IF (NOT EXISTS (SELECT Username FROM AGENT WHERE Username = agentUsername)) THEN
    BEGIN
    
		-- if the user does not exist in the database
        -- then insert the new user into the database
		INSERT INTO AGENT (Username, PasswordHash)
        VALUES (agentUsername, passwordHash);
    
		-- output a success message
		SET message = "SUCCESS";
    
    END;
    ELSE
    BEGIN
		
        -- if the user already exists in the database
        -- then output an error message
        SET message = "ERROR - Username already exists!";
        
    END;
    END IF;

END $$

CREATE PROCEDURE RATE_POST (IN agentUsername VARCHAR(16), IN postTitle VARCHAR(32), IN postRating INT)
BEGIN

	-- check if the user has already rated the post
	IF (NOT EXISTS (SELECT Rating FROM POST_RATING WHERE PostTitle = postTitle AND AgentUsername = agentUsername)) THEN
	BEGIN
	
		-- if the user has NOT already rated the post
		-- then insert a new rating for the post
		INSERT INTO POST_RATING (AgentUsername, PostTitle, Rating)
		VALUES (agentUsername, postTitle, postRating);
	
	END;
	ELSE
	BEGIN
	
		-- if the user already rated the post
		-- then simply update their rating to the new one
		UPDATE POST_RATING
		SET Rating = postRating
		WHERE AgentUsername = agentUsername AND PostTitle = postTitle;
		
	END;
	END IF;
        
END $$

