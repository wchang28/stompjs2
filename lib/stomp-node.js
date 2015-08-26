(function() {
	var Stomp, overTCP, overWS, wrapTCP, wrapWS;
	Stomp = require('./stomp');
	Stomp.Stomp.setInterval = function(interval, f) {
		return setInterval(f, interval);
	};
	Stomp.Stomp.clearInterval = function(id) {
		return clearInterval(id);
	};
	// ws should implement the WebSocket API interface as described at: http://www.w3.org/TR/websockets/
	// ws MUST support the following properties
	// 1. url
	// ws MUST support the following methods
	// 1. send(d)
	// 2. close()
	// the following event handlers MUST be attached to ws:
	// 1. onopen()
	// 2. onmessage(e)
	// the following event handlers MAY be attached to ws:
	// 1. onerror(e)
	// 1. onclose(e)
	wrapTCP = function(port, host) {
		var socket, ws;
		socket = null;
		var __endCalled = false;
		ws = {
			url: 'tcp://' + host + ':' + port,
			send: function(d) {
				return socket.write(d);
			},
			close: function() {
				__endCalled = true;
				return socket.end();
			}
		};
		var net = require('net');
		socket = net.connect(port, host, function(e) {
			return ws.onopen();
		});
		socket.on('error', function(e) {
			if (__endCalled)	// do not trigger error event if socket.end() is called
				return void 0;
			else
				return typeof ws.onerror === "function" ? ws.onerror(e) : void 0;
		});
		socket.on('close', function(had_error) {
			var event = {wasClean: !had_error};
			return typeof ws.onclose === "function" ? ws.onclose(event) : void 0;
		});
		socket.on('data', function(data) {
			var event = {data: data.toString()};
			return ws.onmessage(event);
		});
		return ws;
	};
	wrapTLS = function(port, host, tlsOptions) {
		var socket, ws;
		socket = null;
		var __endCalled = false;
		ws = {
			url: 'tls://' + host + ':' + port,
			send: function(d) {
				return socket.write(d);
			},
			close: function() {
				__endCalled = true;
				return socket.end();
			}
		};
		var tls = require('tls');
		var options = (tlsOptions ? tlsOptions: {});
		socket = tls.connect(port, host, options, function(e) {
			return ws.onopen();
		});
		socket.on('error', function(e) {
			if (__endCalled)	// do not trigger error event if socket.end() is called
				return void 0;
			else
				return typeof ws.onerror === "function" ? ws.onerror(e) : void 0;
		});
		// TODO: NEED to test below
		///////////////////////////////////////////////////////////////////////////////
		socket.on('close', function(had_error) {
			var event = {wasClean: !had_error};
			return typeof ws.onclose === "function" ? ws.onclose(event) : void 0;
		});
		///////////////////////////////////////////////////////////////////////////////
		socket.on('data', function(data) {
			var event = {data: data.toString()};
			return ws.onmessage(event);
		});
		return ws;
	};
	wrapWS = function(url, protocols, origin, headers, requestOptions, clientConfig) {
		var socket, ws;
		socket = null;
		ws = {
			url: url,
			send: function(d) {
				return socket.send(d);
			},
			close: function() {
				return socket.close();
			}
		};
		var W3CWebSocket = require('websocket').w3cwebsocket;
		protocols = protocols || ['v10.stomp', 'v11.stomp'];
		var socket = new W3CWebSocket(url, protocols, origin, headers, requestOptions, clientConfig);
		socket.onopen = function() {
			return ws.onopen();
		};
		socket.onerror = function(e) {
			return typeof ws.onerror === "function" ? ws.onerror(e) : void 0;
		};
		socket.onclose = function(e) {
			var event = {wasClean: e.wasClean, code: e.code, reason: e.reason};
			return typeof ws.onclose === "function" ? ws.onclose(event) : void 0;
		};
		socket.onmessage = function(e) {
			return ws.onmessage(e);
		};
		return ws;
	};
	overTCP = function(host, port) {
		var ws = wrapTCP(port, host);
		return Stomp.Stomp.over(ws);
	};
	overTLS = function(url, tlsOptions) {
		var out = require('url').parse(url);
		var ws = wrapTLS(out.port, out.hostname, tlsOptions);
		return Stomp.Stomp.over(ws);
	};
	overWS = function(url, protocols, origin, headers, requestOptions, clientConfig) {
		var ws = wrapWS(url, protocols, origin, headers, requestOptions, clientConfig);
		return Stomp.Stomp.over(ws);
	};
	client = function(url, protocols, tlsOptions) {
		var out = require('url').parse(url);
		var protocol = out.protocol.toLowerCase();
		switch(protocol) {
			case 'tcp:':
				return overTCP(out.hostname, out.port);
			case 'tls:':
				return overTLS(url, tlsOptions);
			case 'ws:':
			case 'wss:': {
				var clientConfig;
				if (tlsOptions) clientConfig = {tlsOptions: tlsOptions};
				return overWS(url, void 0, void 0, void 0, void 0, clientConfig);
			}
			default:
				return null;
		}
	};
	exports.overTCP = overTCP;
	exports.overTLS = overTLS;
	exports.overWS = overWS;
	exports.client = client;
}).call(this);
