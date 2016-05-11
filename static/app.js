'use strict';

window.addEventListener('DOMContentLoaded', function() {
	var nick = localStorage.getItem("Chat:nick") || "Invitado",
		form = document.getElementById('input'),
		input = form.getElementsByTagName('input')[0],
		socket = null,
		peers = {
			data: {},
			dom: document.getElementById('peers'),
			update: function() {
				while(this.dom.firstChild) this.dom.removeChild(this.dom.firstChild);
				for(var id in this.data) {
					var li = document.createElement('li');
					li.appendChild(document.createTextNode(this.data[id]));
					this.dom.appendChild(li);
				}
			}
		},
		messages = {
			dom: document.getElementById('messages'),
			chars: (function() {
				var chars = [];
				for(var i=0; i<=9; i++) chars += String.fromCharCode(48 + i);
				for(var j=0; j<2; j++) {
					for(var i=0; i<=25; i++) chars += String.fromCharCode((j === 0 ? 97 : 65)+ i);
				}
				return chars;
			})(),
			clear: function() {
				while(this.dom.firstChild) this.dom.removeChild(this.dom.firstChild);
			},
			appendRaw: function(text, className) {
				var self = this,
					div = document.createElement('div'),
					steps = [],
					animate = function() {
						div.firstChild && div.removeChild(div.firstChild);
						var mangled = "",
							done = true;

						steps.forEach(function(step, i) {
							if(step == 0) mangled += text.charAt(i);
							else {
								done = false;
								mangled += self.chars[Math.floor(Math.random() * self.chars.length)];
								steps[i]--;
							}
						});
						div.appendChild(document.createTextNode(mangled));
						!done && setTimeout(animate, 100);
					};

				for(var i=0; i<text.length; i++) {
					steps[i] = text.charAt(i) === ' ' ? 0 : (Math.floor(Math.random() * text.length / 4) + 1);
				}
				animate();
				className && (div.className = className);
				this.dom.appendChild(div);
				document.body.scrollTop = document.body.scrollHeight;
			},
			append: function(peer, message, server) {
				this.appendRaw((server ? '[' : '<') + peers.data[peer] + (server ? ']' : '>') + ' ' + message, server ? 'server' : '');
			}
		},
		onmessage = function(e) {
			var data = e.data.split(':'),
				silent = data[0].charAt(0) === '-',
				peer = data[0].substr(silent ? 1 : 0),
				message = data[1],
				server = false;

			if(data.length === 1) {
				message = 'Se ha desconectado.';
				server = true;
			} else if(!peers.data[peer]) {
				peers.data[peer] = message;
				peers.update();
				message = 'Se ha conectado.';
				server = true;
			}
			
			!silent && messages.append(peer, message, server);
			
			if(data.length === 1) {
				delete peers.data[peer];
				peers.update();
			}
		},
		connect = function() {
			var xhr = new XMLHttpRequest();
			xhr.addEventListener('load', function() {
				var log = this.responseText.split('\n'),
					opened = false;

				socket = new WebSocket("ws://" + document.location.host + ":81/" + nick);
				socket.onopen = function() {
					opened = true;
					messages.clear();
					log.forEach(function(line) {
						line && messages.appendRaw(line, line.charAt(0) === '[' ? 'server' : null);
					});
					onmessage({data: "x:" + nick});
					form.className = 'active';
					input.focus();
				};
				socket.onclose = function(e) {
					for(var id in peers.data) onmessage({data: id});
					socket = null;
					messages.clear();
					if(!opened) {
						messages.appendRaw('Por favor, visita: "http://chat.net/" en tu navegador.', 'fixed');
					} else {
						messages.appendRaw('Conectando...', 'fixed');
						setTimeout(connect, 0);
					}
				};
				socket.onmessage = onmessage;
			});
			xhr.addEventListener('error', function() {
				setTimeout(connect, 1000);
			});
			xhr.open('GET', '/log.txt');
			xhr.send();
		};

	form.addEventListener('submit', function(e) {
		e.preventDefault();
		var message = form.message.value.trim();

		if(!socket || !message) return;
		if(message.substr(0, 5) === '/nick') {
			localStorage.setItem("Chat:nick", message.substr(5).trim());
			location.reload();
		} else {
			socket.send(message);
			onmessage({data: "x:" + message})
			form.reset();
		}
	});

	window.addEventListener('click', function(e) {
		e.target !== input && form.className === 'active' && input.focus();
	});
	
	messages.appendRaw('Conectando...', 'fixed');
	document.body.style.display = '';
	setTimeout(connect, 1000);
});
