const skip = require('./skip');
const pause = require('./pause');
const { play, playNext, playAgain } = require('./playSong');
const queue = require('./queue');
const move = require('./move');
const remove = require('./remove');
const clear = require('./clear');
const goto = require('./goto');
const shuffle = require('./shuffle');
const playHere = require('./playHere');
const { search, searchNext } = require('./searchSong');
const version = require('./version');
const helpMaker = require('./help');

const allCommands = [
    play,
    playNext,
    playAgain,
    pause,
    skip,
    queue,
    move,
    remove,
    clear,
    goto,
    shuffle,
    search,
    searchNext,
    playHere,
    version,
];

const help = helpMaker(allCommands);

allCommands.push(help);

module.exports = allCommands;
