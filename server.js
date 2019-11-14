// Requires
let express = require('express');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let { UserList } = require('./model');
// Setup
let app = express();
let jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(morgan('combined'));

// API
app.post('/api/register', jsonParser, (req, res) => {
	let {email, password} = req.body;
	UserList.postUser({email, password}).then(user => {
		console.log(user);
		return res.status(200).json(user);
	}).catch(err => {
		console.log(err);
		return res.status(500).json(err);
	});
})

let server;

function runServer(port, databaseUrl) {
	return new Promise( function(resolve, reject) {
		mongoose.connect(databaseUrl, function(error) {
			if (error) {
				return reject(error);
			}
			else {
				server = app.listen(port, function() {
					console.log('You have entered a cursed land ' + port);
					resolve();
				}).on('error', function(error) {
					mongoose.disconnect();
					return reject(error);
				});
			}
		});
	});
};

runServer("8080", "mongodb://localhost/telosTest").catch(function(error) {
	console.log(error);
});

function closeServer(){
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing the server');
			server.close( err => {
				if (err){
					return reject(err);
				}
				else{
					resolve();
				}
			});
		});
	});
}

module.exports = { app, runServer, closeServer };

// Exports
