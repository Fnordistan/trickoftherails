
-- ------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- TrickOfTheRails implementation : @ David Edelstein <davidedelstein@gmail.com>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.

-- Example 1: create a standard "card" table to be used with the "Deck" tools (see example game "hearts"):

CREATE TABLE IF NOT EXISTS `CARDS_RR` (
  `card_id` TINYINT unsigned NOT NULL AUTO_INCREMENT,
  `card_type` TINYINT NOT NULL COMMENT 'ROW (RR)',
  `card_type_arg` TINYINT NOT NULL COMMENT 'COLUMN',
  `card_location` varchar(16) NOT NULL COMMENT 'deck/trickreward/',
  `card_location_arg` int(11) NOT NULL COMMENT 'weight to indicate position',
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `CARDS_TRICK` (
  `card_id` TINYINT unsigned NOT NULL AUTO_INCREMENT,
  `card_type` TINYINT NOT NULL COMMENT 'ROW (RR)',
  `card_type_arg` TINYINT NOT NULL COMMENT 'COLUMN',
  `card_location` varchar(16) NOT NULL COMMENT 'hand/deck',
  `card_location_arg` int(11) NOT NULL COMMENT 'player id or deck position',
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- CREATE TABLE IF NOT EXISTS `TRICK_ROW` (
--  `card_id` TINYINT UNSIGNED NOT NULL,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;


 -- add info about first player
 ALTER TABLE `player` ADD `player_first` BOOLEAN NOT NULL DEFAULT '0';


-- Example 2: add a custom field to the standard "player" table
-- ALTER TABLE `player` ADD `player_my_custom_field` INT UNSIGNED NOT NULL DEFAULT '0';

