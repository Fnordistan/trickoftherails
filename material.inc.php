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
    'railway' => 'b_and_o_railway' ),
    2 => array( 'name' => clienttranslate('C&O'),
    'nametr' => self::_('C&O'),
    'color' => clienttranslate('Green'),
    'colortr' => self::_('Green'),
    'railway' => 'c_and_o_railway' ),
    3 => array( 'name' => clienttranslate('Erie'),
    'nametr' => self::_('Erie'),
    'color' => clienttranslate('Yellow'),
    'colortr' => self::_('Yellow'),
    'railway' => 'erie_railway' ),
    4 => array( 'name' => clienttranslate('NYC'),
    'nametr' => self::_('NYC'),
    'color' => clienttranslate('Gray'),
    'colortr' => self::_('Gray'),
    'railway' => 'nyc_railway' ),
    5 => array( 'name' => clienttranslate('PRR'),
    'nametr' => self::_('PRR'),
    'color' => clienttranslate('Red'),
    'colortr' => self::_('Red'),
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
  10 => '10'
);

$this->trick_type = array(
    1 => array( 'name' => clienttranslate('Locomotive [3]'),
    'nametr' => self::_('Locomotive [3]') ),
    2 => array( 'name' => clienttranslate('Locomotive [4]'),
    'nametr' => self::_('Locomotive [4]') ),
    3 => array( 'name' => clienttranslate('Locomotive [5]'),
    'nametr' => self::_('Locomotive [5]') ),
    4 => array( 'name' => clienttranslate('Locomotive [6]'),
    'nametr' => self::_('Locomotive [6]') ),
    5 => array( 'name' => clienttranslate('Locomotive [∞]'),
    'nametr' => self::_('Locomotive [∞]') ),
    6 => array( 'name' => clienttranslate('City (Pittsburgh)'),
    'nametr' => self::_('City (Pittsburgh)') ),
    7 => array( 'name' => clienttranslate('City (Baltimore)'),
    'nametr' => self::_('City (Baltimore)') ),
    8 => array( 'name' => clienttranslate('City (New York)'),
    'nametr' => self::_('City (New York)') ),
    9 => array( 'name' => clienttranslate('Reservation'),
    'nametr' => self::_('Reservation') ),
    11 => array( 'name' => clienttranslate('Exchange'),
    'nametr' => self::_('Exchange') ),
);