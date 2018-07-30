// const BattleAbilities = require('../Pokemon-Showdown/data/abilities').BattleAbilities;
const BattleAliases = require('../Pokemon-Showdown/data/aliases').BattleAliases;
// const BattleItems = require('../Pokemon-Showdown/data/items').BattleItems;
// const BattleMovedex = require('../Pokemon-Showdown/data/moves').BattleMovedex;
const BattlePokedex = require('../Pokemon-Showdown/data/pokedex').BattlePokedex;
const BattleTypeChart = require('../Pokemon-Showdown/data/typechart').BattleTypeChart;
const BattleDexData = require('./battle-dex-data');
const baseSpeciesChart = BattleDexData.baseSpeciesChart;

/**
 * @param {string} text
 * @return {AnyObject}
 */
function importTeam(text) {
    text = text.split('\n');
    let team = [];
    let curSet = null;
    for (let i = 0; i < text.length; i++) {
        let line = text[i].trim();
        if (line === '' || line === '---') {
            curSet = null;
        } else if (line.substr(0, 3) === '===') {
            team = [];
            line = line.substr(3, line.length - 6).trim();
            let format = 'gen7';
            let bracketIndex = line.indexOf(']');
            if (bracketIndex >= 0) {
                format = line.substr(1, bracketIndex - 1);
                if (format && format.slice(0, 3) !== 'gen') format = 'gen6' + format;
                line = line.substr(bracketIndex + 1).trim();
            }
            let slashIndex = line.lastIndexOf('/');
            if (slashIndex > 0) {
                folder = line.slice(0, slashIndex);
                line = line.slice(slashIndex + 1);
            }
        } else if (!curSet) {
            curSet = {name: '', species: '', gender: ''};
            team.push(curSet);
            let atIndex = line.lastIndexOf(' @ ');
            if (atIndex !== -1) {
                curSet.item = line.substr(atIndex + 3);
                if (toId(curSet.item) === 'noitem') curSet.item = '';
                line = line.substr(0, atIndex);
            }
            if (line.substr(line.length - 4) === ' (M)') {
                curSet.gender = 'M';
                line = line.substr(0, line.length - 4);
            }
            if (line.substr(line.length - 4) === ' (F)') {
                curSet.gender = 'F';
                line = line.substr(0, line.length - 4);
            }
            let parenIndex = line.lastIndexOf(' (');
            if (line.substr(line.length - 1) === ')' && parenIndex !== -1) {
                line = line.substr(0, line.length - 1);
                curSet.species = getTemplate(line.substr(parenIndex + 2)).species;
                line = line.substr(0, parenIndex);
                curSet.name = line;
            } else {
                curSet.species = getTemplate(line).species;
                curSet.name = '';
            }
        } else if (line.substr(0, 7) === 'Trait: ') {
            line = line.substr(7);
            curSet.ability = line;
        } else if (line.substr(0, 9) === 'Ability: ') {
            line = line.substr(9);
            curSet.ability = line;
        } else if (line === 'Shiny: Yes') {
            curSet.shiny = true;
        } else if (line.substr(0, 7) === 'Level: ') {
            line = line.substr(7);
            curSet.level = +line;
        } else if (line.substr(0, 11) === 'Happiness: ') {
            line = line.substr(11);
            curSet.happiness = +line;
        } else if (line.substr(0, 5) === 'EVs: ') {
            line = line.substr(5);
            let evLines = line.split('/');
            curSet.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
            for (let j = 0; j < evLines.length; j++) {
                let evLine = evLines[j].trim();
                let spaceIndex = evLine.indexOf(' ');
                if (spaceIndex === -1) continue;
                let statid = BattleDexData.BattleStatIDs[evLine.substr(spaceIndex + 1)];
                let statval = parseInt(evLine.substr(0, spaceIndex), 10);
                if (!statid) continue;
                curSet.evs[statid] = statval;
            }
        } else if (line.substr(0, 5) === 'IVs: ') {
            line = line.substr(5);
            let ivLines = line.split(' / ');
            curSet.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
            for (let j = 0; j < ivLines.length; j++) {
                let ivLine = ivLines[j];
                let spaceIndex = ivLine.indexOf(' ');
                if (spaceIndex === -1) continue;
                let statid = BattleDexData.BattleStatIDs[ivLine.substr(spaceIndex + 1)];
                let statval = parseInt(ivLine.substr(0, spaceIndex), 10);
                if (!statid) continue;
                if (isNaN(statval)) statval = 31;
                curSet.ivs[statid] = statval;
            }
        } else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
            let natureIndex = line.indexOf(' Nature');
            if (natureIndex === -1) natureIndex = line.indexOf(' nature');
            if (natureIndex === -1) continue;
            line = line.substr(0, natureIndex);
            if (line !== 'undefined') curSet.nature = line;
        } else if (line.substr(0, 1) === '-' || line.substr(0, 1) === '~') {
            line = line.substr(1);
            if (line.substr(0, 1) === ' ') line = line.substr(1);
            if (!curSet.moves) curSet.moves = [];
            if (line.substr(0, 14) === 'Hidden Power [') {
                let hptype = line.substr(14, line.length - 15);
                line = 'Hidden Power ' + hptype;
                if (!curSet.ivs && BattleTypeChart && BattleTypeChart[hptype]) {
                    curSet.ivs = {};
                    // eslint-disable-next-line guard-for-in
                    for (let stat in BattleTypeChart[hptype].HPivs) {
                        curSet.ivs[stat] = BattleTypeChart[hptype].HPivs[stat];
                    }
                }
            }
            if (line === 'Frustration') {
                curSet.happiness = 0;
            }
            curSet.moves.push(line);
        }
    }
    return team;
};

/**
 * @param {string | number} text
 * @return {string}
 */
function toId(text) {
    if (text && text.id) {
        text = text.id;
    } else if (text && text.userid) {
        text = text.userid;
    }
    if (typeof text !== 'string' && typeof text !== 'number') return '';
    return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * @param {string} template
 * @return {AnyObject}
 */
function getTemplate(template) {
    if (!template || typeof template === 'string') {
        let name = template;
        let id = toId(name);
        let speciesid = id;
        if (BattleAliases && BattleAliases[id]) {
            name = BattleAliases[id];
            id = toId(name);
        }
        if (!id) {
            name = '';
        }
        if (!BattlePokedex) {
            BattlePokedex = {};
        }
        if (!BattlePokedex[id]) {
            template = BattlePokedex[id] = {};
            for (let i = 0; i < baseSpeciesChart.length; i++) {
                let baseid = baseSpeciesChart[i];
                if (id.length > baseid.length && id.substr(0, baseid.length) === baseid) {
                    template.baseSpecies = baseid;
                    template.forme = id.substr(baseid.length);
                }
            }
            if (id !== 'yanmega' && id.slice(-4) === 'mega') {
                template.baseSpecies = id.slice(0, -4);
                template.forme = id.slice(-4);
            } else if (id.slice(-6) === 'primal') {
                template.baseSpecies = id.slice(0, -6);
                template.forme = id.slice(-6);
            } else if (id.slice(-5) === 'alola') {
                template.baseSpecies = id.slice(0, -5);
                template.forme = id.slice(-5);
            }
            template.exists = false;
        }
        template = BattlePokedex[id];
        if (template.species) {
            name = template.species;
        }
        if (template.exists === undefined) {
            template.exists = true;
        }
        if (!template.id) {
            template.id = id;
        }
        if (!template.speciesid) {
            template.speciesid = id;
        }
        if (!template.species) {
            template.species = name;
        }
        if (!template.baseSpecies) {
            template.baseSpecies = name;
        }
        if (!template.forme) {
            template.forme = '';
        }
        if (!template.formeLetter) {
            template.formeLetter = '';
        }
        if (!template.formeid) {
            let formeid = '';
            if (template.baseSpecies !== name) {
                formeid = '-' + toId(template.forme);
            }
            template.formeid = formeid;
        }
        if (!template.spriteid) {
            template.spriteid = toId(template.baseSpecies) + template.formeid;
        }
        if (!template.effectType) {
            template.effectType = 'Template';
        }
        if (!template.gen) {
            if (template.forme && template.formeid in {'-mega': 1, '-megax': 1, '-megay': 1}) {
                template.gen = 6;
                template.isMega = true;
                template.battleOnly = true;
            } else if (template.formeid === '-primal') {
                template.gen = 6;
                template.isPrimal = true;
                template.battleOnly = true;
            } else if (template.formeid.slice(-5) === 'totem') {
                template.gen = 7;
                template.isTotem = true;
            } else if (template.formeid === '-alola') {
                template.gen = 7;
            } else if (template.num >= 722) {
                template.gen = 7;
            } else if (template.num >= 650) {
                template.gen = 6;
            } else if (template.num >= 494) {
                template.gen = 5;
            } else if (template.num >= 387) {
                template.gen = 4;
            } else if (template.num >= 252) {
                template.gen = 3;
            } else if (template.num >= 152) {
                template.gen = 2;
            } else if (template.num >= 1) {
                template.gen = 1;
            } else {
                template.gen = 0;
            }
        }
        if (template.otherForms && template.otherForms.indexOf(speciesid) >= 0) {
            if (!BattlePokedexAltForms) {
                BattlePokedexAltForms = {};
            }
            if (!BattlePokedexAltForms[speciesid]) {
                template = BattlePokedexAltForms[speciesid] = extend({}, template);
                let form = speciesid.slice(template.baseSpecies.length);
                let formid = '-' + form;
                form = form[0].toUpperCase() + form.slice(1);
                template.form = form;
                template.species = template.baseSpecies + (form ? '-' + form : '');
                template.speciesid = toId(template.species);
                template.spriteid = toId(template.baseSpecies) + formid;
            }
            template = BattlePokedexAltForms[speciesid];
        }
        if (template.spriteid.slice(-5) === 'totem') {
            template.spriteid = template.spriteid.slice(0, -5);
        }
        if (template.spriteid.slice(-1) === '-') {
            template.spriteid = template.spriteid.slice(0, -1);
        }
    }
    return template;
}

module.exports = {importTeam, getTemplate};
