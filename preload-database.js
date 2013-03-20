var Markov = require('./src/node-markov')
  , log = require('winston')
  , package = require('./package.json')
  , config = require('./config.json')
  , StatusNet = require('./src/StatusNet');

log.cli();
log.info('RDN Ebooks version ' + package.version + ' by ' + package.author);

var markov = new Markov('database.json');

var statusNet = new StatusNet('http://' + config.account.split("@")[1] + '/');
statusNet.on('ready', function() {
	statusNet.auth(config.account.split("@")[0], config.password);
	for(var i = 1; i <= 100; i++) {
		statusNet.fetchPublicTimeline({"page": i}, function(err, timeline) {
			if(err) return log.error('Unable to fetch public timeline page ' + i + ': ' + err.message);

			for(var i = timeline.length - 1; i >= 0; i--) {
				var notice = timeline[i];
				markov.learn(notice.text);
			}
			resolve();
		});
	}

	// Simple promise interface
	var resolved = 0;
	function resolve() {
		if(++resolved == 100) {
			markov.saveDatabase();
		}
	}
});