const util = require('../util/util');
const fs = require('fs');

const team = fs.readFileSync('../data/teams/team1.txt', {'encoding': 'utf8'});
let t = util.importTeam(team);
console.log(t);
