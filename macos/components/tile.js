/**
 * 
 */

 import React from 'react';
 import {
  StyleSheet,
  View,
 } from 'react-native';
import { Children } from 'react/cjs/react.production.min';

// const TYPES = "void" | "water" | "fire" | "rock" | "sand" | "grass";

 const Tile = ({children, type}) => {
  let style;
  switch(type) {
    case "grass":
      style = styles.grass;
      break;
    case "water":
      style = styles.water;
      break;
    case "fire":
      style = styles.fire;
      break;
    case "rock":
      style = styles.rock;
      break;
    case "sand":
      style = styles.sand;
      break;
    case "void":
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