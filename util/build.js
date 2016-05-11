#!/usr/local/bin/node

/* Build Script */

var closurecompiler = require('closurecompiler'),
	sasscompiler = require('node-sass'),
	fs = require('fs-extra'),
	path = require('path'),
	execFile = require('child_process').execFile,
	root = path.join(__dirname, '..', 'static'),
	build = path.join(__dirname, 'build'),
	spiffs = path.join(build, 'spiffs'),
	sass = [
		'screen.sass'
	],
	js = [
		'app.js'
	],
	html = [
		'index.html'
	];

fs.removeSync(build);
fs.mkdirsSync(spiffs);

var DoSass = function(done) {
	var file = sass.shift();
	if(!file) return done();
	console.log("Compiling: " + file);
	sasscompiler.render({
		file: path.join(root, file),
		outputStyle: 'compressed'
	}, function(err, result) {
		fs.writeFile(path.join(spiffs, file.replace(/\.sass/, '.css')), result.css, function() {
			DoSass(done);
		});
	});
};

var DoJS = function(done) {
	var file = js.shift();
	if(!file) return done();
	console.log("Compiling: " + file);
	closurecompiler.compile(path.join(root, file), {
		compilation_level: "SIMPLE_OPTIMIZATIONS"
	}, function(err, js) {
		fs.writeFile(path.join(spiffs, file), js, function() {
			DoJS(done);
		});
	});
};

var DoHTML = function(done) {
	var file = html.shift();
	if(!file) return done();
	console.log("Compiling: " + file);
	fs.readFile(path.join(root, file), 'utf-8', function(err, html) {
		fs.writeFile(path.join(spiffs, file), html.replace(/\t/g, '').replace(/\n/g, '') + '\n', function() {
			DoHTML(done);
		});
	});
};

DoSass(function() {
	DoJS(function() {
		DoHTML(function() {
			console.log('Building: SPIFFS Image');
			const child = execFile(path.join(__dirname, 'mkspiffs', 'mkspiffs'), [
				'-c', spiffs,
				'-p', 256,
				'-b', 4096,
				'-s', 65536,
				path.join(build, 'spiffs.bin')
			], function(err, stdout, stderr) {
				console.log('Done!');
			});
		});
	});
});
