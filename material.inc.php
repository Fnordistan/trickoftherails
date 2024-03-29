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
    'prefix' => 'b_and_o',
    'railway' => 'b_and_o_railway' ),
    2 => array( 'name' => clienttranslate('C&O'),
    'nametr' => self::_('C&O'),
    'prefix' => 'c_and_o',
    'railway' => 'c_and_o_railway' ),
    3 => array( 'name' => clienttranslate('Erie'),
    'nametr' => self::_('Erie'),
    'prefix' => 'erie',
    'railway' => 'erie_railway' ),
    4 => array( 'name' => clienttranslate('NYC'),
    'nametr' => self::_('NYC'),
    'prefix' => 'nyc',
    'railway' => 'nyc_railway' ),
    5 => array( 'name' => clienttranslate('PRR'),
    'nametr' => self::_('PRR'),
    'prefix' => 'prr',
    'railway' => 'prr_railway' ),
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
  10 => '10',
  11 => clienttranslate('Exchange')
);

$this->trick_type = array(
    1 => array( 'name' => '[3]'),
    2 => array( 'name' => '[4]'),
    3 => array( 'name' => '[5]'),
    4 => array( 'name' => '[6]'),
    5 => array( 'name' => '[∞]'),
    6 => array( 'name' => clienttranslate('City (Pittsburgh)')),
    7 => array( 'name' => clienttranslate('City (Baltimore)')),
    8 => array( 'name' => clienttranslate('City (New York)')),
    9 => array( 'name' => clienttranslate('Reservation')),
    11 => array( 'name' => clienttranslate('Exchange')),
);

$this->station_values = array(
  /** B&O */    array(10, 10, 10, 20, 20, 20, 20, 30, 30, 40, 0, 10),
  /** C&O */    array(40, 30, 30, 20, 20, 20, 20, 10, 10, 10, 0, 10),
  /** Erie */   array(30, 20, 20, 10, 30, 10, 20, 20, 40, 10, 0, 10),
  /** NYC */    array(20, 20, 30, 10, 20, 40, 10, 20, 30, 10, 0, 10),
  /** PRR */    array(10, 20, 20, 30, 40, 30, 20, 20, 10, 10, 0, 10),
  /** LASTROW*/ array(-40, -50, -60, -70, -80, 20, 30, 40, 0, 0, 0, 0)
);