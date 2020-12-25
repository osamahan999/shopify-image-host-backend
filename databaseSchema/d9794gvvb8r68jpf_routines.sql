-- MySQL dump 10.13  Distrib 8.0.22, for Linux (x86_64)
--
-- Host: l0ebsc9jituxzmts.cbetxkdyhwsb.us-east-1.rds.amazonaws.com    Database: d9794gvvb8r68jpf
-- ------------------------------------------------------
-- Server version	8.0.15

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Dumping events for database 'd9794gvvb8r68jpf'
--

--
-- Dumping routines for database 'd9794gvvb8r68jpf'
--
/*!50003 DROP PROCEDURE IF EXISTS `acceptInvite` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`xgk03ao75v9m8c2d`@`%` PROCEDURE `acceptInvite`(inviteId INT UNSIGNED, userUUID CHAR(64), repoId INT UNSIGNED)
BEGIN
DECLARE userId INT UNSIGNED;


/* Handled like transaction, if one fails, rollback all*/
DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;

SET userId = (SELECT user_id FROM user WHERE user.userUUID = userUUID);

START TRANSACTION;


-- check if user does indeed have an invite
IF ((SELECT COUNT(*) FROM user_repo_invites WHERE (invite_id = inviteId) AND (invited_id = userId) AND (repo_id = repoId)) != 0) THEN

	SELECT canUpload, canDeleteImg, canRenameRepo, canDeleteRepo 
    INTO @canUploadTemp, @canDeleteImgTemp, @canRenameRepoTemp, @canDeleteRepoTemp
	FROM user_repo_invites WHERE (invite_id = inviteId AND invited_id = userId AND repo_id = repoId) ;
    
    -- insert into repo perms
    INSERT INTO user_repository_permissions (user_id, isOwner, canUpload, canDeleteImg, canRenameRepo, canDeleteRepo, repo_id)
		VALUES (userId, 0, @canUploadTemp, @canDeleteImgTemp, @canRenameRepoTemp, @canDeleteRepoTemp, repoId);
        
	DELETE FROM user_repo_invites WHERE invited_id = userId AND repo_id = repoId ; -- invite handled 


END IF;
    
    
    
/* rollback on exception*/
IF `_rollback` THEN
	ROLLBACK;
ELSE
	COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `getRepoImages` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`xgk03ao75v9m8c2d`@`%` PROCEDURE `getRepoImages`(repoID int UNSIGNED, userUUID CHAR(64) )
BEGIN
	
    IF ((SELECT count(*) FROM user_repository_permissions WHERE 
    user_id = (SELECT user_id FROM user WHERE user.userUUID = userUUID) 
    AND (repo_id = repoID)) > 0) THEN
	

	SELECT 
		image_url.image_id, image_url.url, image_url.image_text as title, group_concat(tag.tag_text separator ', ') AS tags 
	FROM image_url 
	
	NATURAL JOIN img_in_repo 
	NATURAL JOIN img_has_tag 
	NATURAL JOIN tag 
	
    WHERE 
		(img_in_repo.repo_id = repoID) 
	AND 
		(image_url.url IS NOT NULL AND image_url.url != '')
        
	GROUP BY image_id 
	ORDER BY image_url.date_uploaded DESC;
    ELSE
    	SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You dont have access to this repo!';
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `insertImage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`xgk03ao75v9m8c2d`@`%` PROCEDURE `insertImage`(
imageUrl VARCHAR(256), 
imageText VARCHAR(128), 
repoID INT, 
inUserUUID CHAR(64),
tagsArrayString VARCHAR(100) 
)
BEGIN
	
DECLARE imgId INT UNSIGNED; /* holds img id after insert*/

DECLARE tags_array_local VARCHAR(100);
DECLARE start_pos SMALLINT;
DECLARE comma_pos SMALLINT;
DECLARE currentTag VARCHAR(100);
DECLARE end_loop TINYINT;

DECLARE tagID INT; /*Used for insert img_has_tag and shit like that*/


/* Handled like transaction, if one fails, rollback all*/
DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;




START TRANSACTION;
/**
If user can upload and img not in repo alrdy, do inserts
*/
IF 
(
SELECT 
	canUpload FROM user_repository_permissions 
    WHERE ( 
		user_id = 
			(SELECT user_id FROM user 
			WHERE user.userUUID = inUserUUID 
			) 
	AND 
		user_repository_permissions.repo_id = repoID

    )
) = 1

THEN
	
    INSERT INTO image_url (image_text, date_uploaded, url) VALUES (imageText, NOW(), imageUrl);
    SET imgId = LAST_INSERT_ID();

	
    
    /*Insert into img_in_repo that img id is in repo_id*/
	INSERT INTO img_in_repo (image_id, repo_id) VALUES (imgId, repoID);
    
    
	/* initialize loop through tags string*/
	SET tags_array_local = tagsArrayString;
	SET start_pos = 1;
	SET comma_pos = locate(',', tags_array_local);

	/*Got this loop structure from https://somedevtips.com/web/mysql-procedure-array-parameter*/
	REPEAT
        IF comma_pos > 0 THEN
            SET currentTag = substring(tags_array_local, start_pos, comma_pos - start_pos);
            SET end_loop = 0;
        ELSE
            SET currentTag = substring(tags_array_local, start_pos);
            SET end_loop = 1;
        END IF;
     
        
        /* if tag exists, get its id, else insert it and get new id*/
        IF (SELECT COUNT(*) FROM tag WHERE tag_text = currentTag) = 0 THEN
			INSERT INTO tag (tag_text, date_created) VALUES (currentTag, NOW());
            SET tagID = LAST_INSERT_ID();
		ELSE 
			SET tagID = (SELECT tag_id FROM tag WHERE tag_text = currentTag);
        END IF;
		
        INSERT INTO img_has_tag(image_id, tag_id, date_added) VALUES (imgId, tagID, NOW());
        

        IF end_loop = 0 THEN
            SET tags_array_local = substring(tags_array_local, comma_pos + 1);
            SET comma_pos = locate(',', tags_array_local);
        END IF;
	UNTIL end_loop = 1

    END REPEAT;
    
    
	/* rollback on exception*/
	IF `_rollback` THEN
			ROLLBACK;
		ELSE
			COMMIT;
	END IF;


ELSE

SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You cannot add images to this repo!';

	
END IF;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `inviteUser` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`xgk03ao75v9m8c2d`@`%` PROCEDURE `inviteUser`(
inviterUUID CHAR(64) , 
invitedUserName VARCHAR(64), 
repoId INT UNSIGNED, 
canUpload TINYINT(1) UNSIGNED, 
canDeleteImg TINYINT(1) UNSIGNED, 
canRenameRepo TINYINT(1) UNSIGNED, 
canDeleteRepo TINYINT(1) UNSIGNED)
BEGIN

DECLARE inviterId INT UNSIGNED;
DECLARE invitedId INT UNSIGNED;
DECLARE errorEncountered BOOLEAN DEFAULT FALSE;


SET inviterId = (SELECT user_id FROM user WHERE user.userUUID = inviterUUID);
SET invitedId = (SELECT user_id FROM user WHERE user.username = invitedUserName); 

IF (((SELECT public FROM repository WHERE repo_id = repoId AND owner_id = inviterId) = true) = false) THEN
	SET errorEncountered = TRUE; -- using this in case signal doesnt break out of procedure
	SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "Not public repo OR do not have permission to invite";
END IF;

IF (((SELECT COUNT(*) FROM user_repo_invites WHERE invited_id = invitedId AND repo_id = repoId) = 0) = false) THEN
	SET errorEncountered = TRUE;
	SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'already invited';
END IF;

IF ((SELECT COUNT(*) FROM user_repository_permissions WHERE user_id = invitedId AND repo_id = repoId) > 0) THEN
	SET errorEncountered = TRUE;
	SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'already in repo';
END IF;

IF (errorEncountered = FALSE) THEN
	INSERT INTO user_repo_invites (inviter_id, invited_id, repo_id, canUpload, canDeleteImg, canRenameRepo, canDeleteRepo)
		VALUES (inviterId, invitedId, repoId, canUpload, canDeleteImg, canRenameRepo, canDeleteRepo);
END IF;



END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `newRepo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`xgk03ao75v9m8c2d`@`%` PROCEDURE `newRepo`(userUUID CHAR(64), repoName VARCHAR(32), public BOOLEAN)
BEGIN

DECLARE userID INT UNSIGNED;
DECLARE repoId INT UNSIGNED;

/* Handled like transaction, if one fails, rollback all*/
DECLARE `_rollback` BOOL DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;

START TRANSACTION;


SET userID = (SELECT user_id FROM user WHERE user.userUUID = userUUID);


INSERT INTO repository (owner_id, date_created, name, public) VALUES
(userID, NOW(), repoName, public);
SET repoId = LAST_INSERT_ID();


INSERT INTO user_repository_permissions (user_id, isOwner, canUpload, canDeleteImg, canRenameRepo, canDeleteRepo, repo_id) 
VALUES (userID, 1, 1, 1, 1, 1, repoId);


/* rollback on exception*/
 IF `_rollback` THEN
        ROLLBACK;
    ELSE
        COMMIT;
END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `renameRepo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`xgk03ao75v9m8c2d`@`%` PROCEDURE `renameRepo`(userUUID CHAR(64), repoId INT UNSIGNED, newName VARCHAR(32))
BEGIN
DECLARE userID INT UNSIGNED;
DECLARE canRename TINYINT UNSIGNED;

SET userID = (SELECT user_id FROM user WHERE user.userUUID = userUUID);
SET canRename = (SELECT canRenameRepo FROM user_repository_permissions WHERE repo_id = repoId AND user_id = userID);

IF (canRename = 1) THEN
UPDATE repository SET name = newName WHERE repo_id = repoId;
ELSE 


SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid permissions';
END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-25 13:36:08
