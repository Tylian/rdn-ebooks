var Markov = require('./src/node-markov')
  , log = require('winston')
  , package = require('./package.json')
  , config = require('./config.json')
  , StatusNet = require('./src/StatusNet');

var sources = ['free car loans', 'land of markov and chains', 'what', 'anypony_ebooks', 'the moon'];

log.cli();
log.info('RDN Ebooks version ' + package.version + ' by ' + package.author);

var markov = new Markov('database.json');

var statusNet = new StatusNet('http://' + config.account.split("@")[1] + '/');
statusNet.on('ready', function() {
	statusNet.auth(config.account.split("@")[0], config.password);
	statusNet.source = "free cash loans";

	if(config.crawlTimeline) {
		parseTimeline();
		setInterval(parseTimeline, config.refreshRate * 1000);
	}

	postNotice();
	setInterval(postNotice, config.cooldown * 1000)
});

var lastNoticeId = 0;
function parseTimeline() {
	log.info('Fetching timeline...');
	statusNet.fetchPublicTimeline({"since_id": lastNoticeId}, function(err, timeline) {
		if(err) return log.error('Unable to fetch public timeline: ' + err.message);

		log.info('OK. Parsing ' + timeline.length + ' notices...');

		for(var i = timeline.length - 1; i >= 0; i--) {
			var notice = timeline[i];
			lastNoticeId = notice.id;

			markov.learn(notice.text);
		}
		markov.saveDatabase();
	});
}

function postNotice() {
	var notice = markov.generate(30, true);

	statusNet.source = sources[Math.round(Math.random() * (sources.length - 1))];

	// Abuse unicode zero-width spaces to remove @ mentions.
	notice = notice.replace(/@([a-z0-9_]+)/g, '@\u200B$1');

	log.info('Posting notice: ' + notice);
	statusNet.postNotice(notice);
}