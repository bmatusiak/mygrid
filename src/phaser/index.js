
const Phaser = require('phaser');

plugin.consumes = [];
plugin.provides = ['Phaser'];
async function plugin(_imports, register) {

    await register(null, {
        Phaser
    });
}
module.exports = plugin;