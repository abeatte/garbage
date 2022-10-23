/**
 * 
 */

 import React from 'react';
 import {
  StyleSheet,
  View,
 } from 'react-native';

export const TYPE = {"void": 0, "water": 1, "fire": 2, "rock": 3, "sand": 4, "grass": 5};

 const Tile = ({children, type}) => {
  let style;
  switch(type) {
    case TYPE.grass: 
      style = styles.grass;
      break;
    case TYPE.water:
      style = styles.water;
      break;
    case TYPE.fire:
      style = styles.fire;
      break;
    case TYPE.rock:
      style = styles.rock;
      break;
    case TYPE.sand:
      style = styles.sand;
      break;
    case TYPE.void:
      // falthrough
    default:
      style = styles.void;
  }
    return (
      <View style={style}>{children}</View>
    );
 }; 

 const styles = StyleSheet.create({
  void: {
    width: 25,
    height: 25,
    backgroundColor: "black",
   },
   grass: {
    width: 25,
    height: 25,
    backgroundColor: "green",
   },
   water: {
    width: 25,
    height: 25,
    backgroundColor: "blue",
   },
   fire: {
    width: 25,
    height: 25,
    backgroundColor: "red",
   },
   rock: {
    width: 25,
    height: 25,
    backgroundColor: "gray",
   },
   sand: {
    width: 25,
    height: 25,
    backgroundColor: "yellow",
   },
 });
 
 export default Tile;