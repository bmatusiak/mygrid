
var app_config = [
  require('./main'),
  require('./phaser'),
  require('./game'),
]

var rectify = require('@bmatusiak/rectify');

(async function starter() {
  var app = rectify.build(app_config)
  app = await app.start();
  app.services.app.emit("start");
})();