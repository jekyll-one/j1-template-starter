#!/usr/bin/env node
"use strict"

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

var getos = require('getos')

getos(function(e,os) {
  //var os_info = JSON.stringify(os);
  if(e) return console.log(e)
  console.log(os['os'])
})
