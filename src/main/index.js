
plugin.consumes = ['app', 'game'];
plugin.provides = [];
async function plugin(imports, register) {
    const { app, game } = imports;

    app.on("start", () => {

        game.init();

    });
    await register(null, {});
}
module.exports = plugin;