'use strict';
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { weekly } = require('../assets/js/data.js');
const { toCSV } = require('../assets/js/model.js');
const destination = join(__dirname, '..', 'data', 'sample-weekly-counts.csv');
writeFileSync(destination, toCSV(weekly), 'utf8');
console.log('Exported ' + weekly.length + ' synthetic records to data/sample-weekly-counts.csv');
