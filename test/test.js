function makeString(length, ch) {
	var s = "";
	for (var i=0; i < length; i++)
		s += ch;
	return s;
}

var msg = makeString(160000, 'C');
//var msg = makeString(1600, 'C');
//var msg = 'Hi, how are you';

var queues = ['/queue/test'];
var destination = '/queue/test';
//var queues = ['/topic/test'];
//var destination = '/topic/test';

var recepit_id = 'xxx-yyy';
var reconnect_interval_ms = 10000;

if (typeof exports !== "undefined" && exports !== null) {	// run inside node.js
	global.Stomp = require('stompjs2');
}

function createWSClient(url) {
	var client;
	if (typeof window !== "undefined" && window !== null && window.Stomp) // run inside browser
		client = Stomp.client(url);
	else
		client = Stomp.overWS(url);
	return client;
}

function messageProcessor(msg) {
	
}

function conectClient() {
	var client;
	//console.log(this);
	//client = createWSClient('ws://fkeydev.bluesageusa.com:61614');	// work in node.js and browser
	//client = Stomp.overTCP('fkeydev.bluesageusa.com', 61613);			// work in node.js
	//client = createWSClient('ws://uatportal.firstkeyeasy.com:61614');	// doesn't work, probably blocked by BSS
	//client = Stomp.overTCP('uatportal.firstkeyeasy.com', 61613);	// work in node.js
	
	//client = createWSClient('ws://harvest.firstkeyholdings.com:61623');	// work in node.js and browser
	client = createWSClient('wss://harvest.firstkeyholdings.com:61624');	// work in node.js and browser
	
	//client = createWSClient('ws://harvesttesting.firstkeyholdings.com:61623');	// work in node.js and browser
	//client = createWSClient('wss://harvesttesting.firstkeyholdings.com:61624');	// work in node.js and browser
	
	//client = createWSClient('ws://xxxyy.yzzz.wenhome:61614');
	
	//client = Stomp.overTCP('xxxyy.yzzz.wenhome', 61613);	// ENOTFOUND
	//client = Stomp.overTCP('fkeydev.bluesageusa.com', 7070);	// ETIMEDOUT
	//client = Stomp.overWS('ws://fkeydev.bluesageusa.com:61614');
	//client = Stomp.overWS('ws://xxxyy.yzzz.wenhome:61614');
	//client = createWSClient('wss://shohuo28.ddns.net:61624');
	//client = createWSClient('ws://shohuo28.ddns.net:61623');
	//client = Stomp.overWS('wss://shohuo28.ddns.net:61624', void 0, void 0, void 0, void 0, {tlsOptions: {'ca': require('fs').readFileSync('C:/open_ssl_test/my_self_signed_cert.pem')}});
	//client.heartbeat.outgoing = 20000;
	client.heartbeat.incoming = 0;
	client.heartbeat.scale_factor = 0.8;
	client.debug = function(msg) {console.log(msg);};
	
	if (typeof client.on == 'function') {
		client.on('heartbeat'
		,function(source) {
			console.log(source + " (-)HEART_BEAT(-)");
		}).on('close'
		,function(e) {
			console.log('connection closed: ' + e);
			console.log('will reconnect in ' + reconnect_interval_ms + ' ms');
			setTimeout(conectClient, reconnect_interval_ms);
		});
	}
	
	function getOnReceipeHandler(recepit_id, cb) {
		return (function(frame)	{
			if (frame.headers['receipt-id'] == recepit_id) {
				if (typeof cb == 'function') cb();
			}
		});
	}
	
	function getMessageCallBack(queue) {
		return (
			function(message) {
				if (message.body) {
					console.log('queue ' + queue + ' got a message (id='+ message.headers['message-id'] + ') with body (' + message.body.length + ' bytes)');
				} else {
					console.log('queue ' + queue + ' got an empty message( id='+ message.headers['message-id'] + ')');
				}
				// and acknowledge it
				message.ack();
				messageProcessor(message.body);
			}
		);
	}
	
	console.log('connecting to client...');
	client.connect('fkeyuser', 'Gr33nMercury'
	,function() {
		console.log('stomp connected');
		console.log('sending a message of length ' + msg.length + ' byte(s) to ' + destination + ' with recepit ' + recepit_id);
		client.send(destination, { persistent: true,  receipt: recepit_id}, msg);
		client.onreceipt = getOnReceipeHandler(recepit_id,
		function() {
			console.log('server confirmed message received. subscribing to queues...');
			subscriptions = {};
			for (var i in queues)
			{
				var queue = queues[i];
				subscriptions[queue] = client.subscribe(queue, getMessageCallBack(queue), {ack: 'client'});
				console.log('queue ' + queue + ' ---> subscriptions id=' + subscriptions[queue].id);
			}
		});
	}
	,function(err){
		console.log('stomp error: ' + JSON.stringify(err));
		//console.log('stomp error: ' + err.toString());
	});
}

conectClient();
