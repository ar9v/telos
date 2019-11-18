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

	//Initialize Pomodoro
	let pomodoro  = {
		workLength: 25,
		breakLength: 5,
		longBreakLength: 30
	};
	UserList.postUser({email, password, pomodoro}).then(user => {
		console.log(user);
		return res.status(200).json(user);
	}).catch(err => {
		console.log(err);
		return res.status(500).json(err);
	});
});

app.get('/api/User', jsonParser, (req, res) => {
	let email = req.query.email;
	UserList.getByEmail(email).then( response => {
		console.log(response);
		return res.status(200).json(response);
	}).catch( err => {
		console.log(err);
		return res.status(500).json(err);
	})

});

app.post('/api/createCourse', jsonParser, (req, res) => {
	let {email, name, allotedTime} = req.body;

	UserList.postCourse(email, {name, allotedTime, spentTime: 0}).then(response => {
		console.log(response);
		if(response == 404)  {
			res.statusMessage = "User not found";
			return res.status(404).json({message: "User not found"});
		}
		if(response == 409) {
			res.statusMessage = "Course already Exists";
			return res.status(409).json({message: "Course already Exist"});
		}
		return res.status(200).json(response);
	}).catch( err => {
		console.log(err);
		return res.status(500).json(err);
	})
});

app.put('/api/updateCourse', jsonParser, (req, res) => {
	let {email, name, allotedTime} = req.body;
	UserList.putCourse(email, {name, allotedTime}).then( response => {
		console.log(response);
		if(response == 404)  {
			res.statusMessage = "Course not found";
			return res.status(404).json({message: "Course not found"});
		}
		return res.status(200).json(response);
	}).catch( error => {
		console.log(error);
		return res.status(500).json(error);
	})
});

app.delete('/api/deleteCourse', jsonParser, (req, res) => {
	let {email, name} = req.body;
	UserList.deleteCourse(email, name).then( response => {
		return res.status(202).json();
	}).catch(err => {
		console.log(err);
		return res.status(500).json(err);
	})
});

app.post('/api/createTask', jsonParser, (req, res) => {
	let { email, name, description} = req.body;
	UserList.createTask(email, name, {description, complete: false}).then( response => {
		console.log(response);
		return res.status(200).json(response);
	}).catch(err => {
		console.log(err);
		return res.status(500).json(err);
	})
});

app.delete('/api/deleteTask', jsonParser, (req, res) => {
	let { email, name, id} =  req.body;
	UserList.deleteTask(email, name, id).then( response => {
		console.log(response);
		return res.status(200).json(response);
	}).catch(error => {
		console.log(error);
		return res.status(500).json(error);
	})
});

app.put('/api/updatePomodoro', jsonParser, (req, res) => {
	let { email, pomodoro } = req.body;
	UserList.updatePomodoro(email, pomodoro).then( response => {
		return res.status(200).json(response);
	}).catch(err => {
		return res.status(500).json(err);
	});
});

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
