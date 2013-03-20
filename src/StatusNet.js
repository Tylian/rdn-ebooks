var EventEmitter = require('events').EventEmitter
  , request = require('request')
  , log = require('winston')
  , cheerio = require('cheerio')
  , util = require('util')
  , querystring = require('querystring');

var rsdPattern = /<link\s*rel="EditURI"\s*type="application\/rsd\+xml"\s*href="(.+)"\s*\/>/i

function StatusNet(baseUrl) {
	EventEmitter.call(this);
	var self = this;

	this.source = "api";
	this.account = "";
	this.password = "";

	request.get(baseUrl, function(err, response, body) {
		if(err) return log.error('Error fetching API root: ' + err.message);

		var $ = cheerio.load(body);

		var rsd = $('link[rel=EditURI][type="application/rsd+xml"]').attr('href');
		if(!rsd) {
			log.error('Error fetching API root: RSD location not found.');
			return;
		}

		request.get(rsd, function(err, response, body) {
			if(err) return log.error('Error fetching API root: ' + err.message);

			var $ = cheerio.load(body, {xmlMode: true});
			self.apiPath = $('api[name=Twitter][preferred=true]').attr('apiLink')

			if(!self.apiPath) {
				log.error('Error fetching API root: Unable to find API path in RSD');
			}

			self.emit('ready');
		});
	});
}
util.inherits(StatusNet, EventEmitter);

StatusNet.prototype.auth = function(account, password) {
	this.account = account;
	this.password = password;

	this.auth = this.account + ':' + this.password;
}

StatusNet.prototype.fetchPublicTimeline = function(query, callback) {
	if(typeof query == 'function') {
		callback = query;
		query = {};
	}
	var options = {
		"url": this.apiPath + 'statuses/public_timeline.json?' + querystring.stringify(query),
		"json": true
	};
	request.get(options, function(err, request, body) {
		callback(err, body);
	});
}

StatusNet.prototype.postNotice = function(status, replyTo) {
	var data = {
		"auth": {
			"username": this.account,
			"password": this.password
		},
		"form": {
			"status": status,
			"source": this.source
		}
	};

	if(replyTo) data['in_reply_to'] = replyTo;

	request.post(this.apiPath + 'statuses/update.json', data, function(err, response, body) {
		if(err) {
			log.error('Could not post notice: ' + err.message);
		}
	});
}

module.exports = StatusNet;