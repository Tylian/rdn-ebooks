var fs = require("fs")
  , zlib = require("zlib");

function Markov(database) {
	this.database = database;
	this.seed = [];
	this.chain = {};

	if(database && fs.existsSync(database)) {
		this.loadDatabase();
	}
}

Markov.prototype.learn = function(text) {
	if(text instanceof Array) {
		for(var i = 0; i < text.length; i++) {
			this.learn(text[i]);
		}
	}

	text = text.split(" ");

	var seed = text.slice(0, 2);
	if(this.seed.indexOf(seed) == -1) {
		this.seed.push(seed);
	}

	if(text.length < 3)
		return;

	for(var i = 0; i < text.length - 2; i++) {
		var prefix = text.slice(i, i + 2).join(' ');
		var item = text[i + 2];
		if(!this.chain[prefix]) {
			this.chain[prefix] = [item];
		} else if(this.chain[prefix].indexOf(item) == -1) {
			this.chain[prefix].push(item);
		}
	}
}

Markov.prototype.saveDatabase = function() {
	var database = {
		'seed': this.seed,
		'chain': this.chain
	};

	var buffer = new Buffer(JSON.stringify(database), 'utf8');
	//zlib.gzip(buffer, function(err, result) {
		fs.writeFileSync(this.database, buffer);
	//}.bind(this));
}

Markov.prototype.loadDatabase = function() {
	var database = fs.readFileSync(this.database);
	//zlib.gunzip(database, function(err, result) {
		//database = JSON.parse(result.toString('utf8'));
		database = JSON.parse(database.toString('utf8'));

		this.seed = database.seed;
		this.chain = database.chain;
	//}.bind(this));
}

// Helper function to compress a database with possible duplicate nodes
Markov.prototype.compressDatabase = function() {
	function unique(item, i, source){
		return i == source.indexOf(item);
	}

	this.seed = this.seed.filter(unique);
	for(i in this.chain) {
		this.chain[i] = this.chain[i].filter(unique);
	}
}

Markov.prototype.learnFromFile = function(path) {
    var data = fs.readFileSync(path, 'utf8');
    var lines = data.split("\n");
    for(var i = 0; i < lines.length; i++) {
    	if(lines[i].length == 0) continue;
    	this.learn(lines[i]);
   	}
}

Markov.prototype.generate = function(limit, removeReal) {
	if(this.seed.length == 0 || this.chain.length == 0)
		throw new Error('can not generate with an empty markov chain');

	var length = 2;
	var output = randomItem(this.seed);
	while(limit--) {
		var prefix = output.slice(-2).join(' ');
		if(!this.chain[prefix])
			break;

		length += this.chain[prefix].length;

		output.push(randomItem(this.chain[prefix]));
	}

	if(length == output.length && removeReal)
		return this.generate(limit, removeReal);
	
	return output.join(' ');
}



function randomItem(source) {
	return source[Math.round(Math.random() * (source.length - 1))];
}

module.exports = Markov;