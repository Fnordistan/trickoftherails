<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * TrickOfTheRails implementation : @ David Edelstein <davidedelstein@gmail.com>
 * 
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * material.inc.php
 *
 * TrickOfTheRails game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */



$this->railroads = array(
    1 => array( 'name' => clienttranslate('B&O'),
    'nametr' => self::_('B&O'),
    'color' => clienttranslate('Blue'),
    'colortr' => self::_('Blue'),
    'abbr' => 'b_and_o' ),
    2 => array( 'name' => clienttranslate('C&O'),
    'nametr' => self::_('C&O'),
    'color' => clienttranslate('Green'),
    'colortr' => self::_('Green'),
    'abbr' => 'c_and_o' ),
    3 => array( 'name' => clienttranslate('Erie'),
    'nametr' => self::_('Erie'),
    'color' => clienttranslate('Yellow'),
    'colortr' => self::_('Yellow'),
    'abbr' => 'erie' ),
    4 => array( 'name' => clienttranslate('NYC'),
    'nametr' => self::_('NYC'),
    'color' => clienttranslate('Gray'),
    'colortr' => self::_('Gray'),
    'abbr' => 'nyc' ),
    5 => array( 'name' => clienttranslate('PRR'),
    'nametr' => self::_('PRR'),
    'color' => clienttranslate('Red'),
    'colortr' => self::_('Red'),
    'abbr' => 'prr' ),
);

$this->values_label = array(
  1 => '1',
  2 => '2',
  3 => '3',
  4 => '4',
  5 => '5',
  6 => '6',
  7 => '7',
  8 => '8',
  9 => '9',
  10 => '10'
);

$this->trick_type = array(
    1 => array( 'name' => clienttranslate('Exchange'),
    'nametr' => self::_('Exchange') ),
    2 => array( 'name' => clienttranslate('Reservation'),
    'nametr' => self::_('Reservation') ),
    3 => array( 'name' => clienttranslate('Locomotive'),
    'nametr' => self::_('Locomotive') ),
    4 => array( 'name' => clienttranslate('City'),
    'nametr' => self::_('City') ),
    5 => array( 'name' => clienttranslate('Railway'),
    'nametr' => self::_('Railway') ),
);