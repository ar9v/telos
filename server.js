// Requires
let express = require('express');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let bcrypt = require('bcryptjs');
let { UserList } = require('./model');
// Setup
let app = express();
let jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(morgan('combined'));

// API
app.get('/dashboard', (req, res) => {
	res.sendFile('/public/dashboard.html', {root: __dirname});
});

app.post('/api/register', jsonParser, (req, res) => {
	let {email, password} = req.body;
	if(!email || !password) {
		return res.status(406).json({
			status: 406,
			message: "Missing Params"
		});
	}
	bcrypt.hash(password, 10).then(hashPasss => {

		UserList.getByEmail(email).then( response => {
			if(response.length == 0) {
				//Initialize Pomodoro
				let pomodoro  = {
					workLength: 25,
					breakLength: 5,
					longBreakLength: 30
				};
				console.log(hashPasss);
				UserList.postUser({email, password: hashPasss, pomodoro}).then(user => {
					console.log(user);
					return res.status(200).json(user);
				}).catch(err => {
					console.log(err);
					return res.status(500).json(err);
				});
			} else {
				return res.status(409).json({message: "User Already Exists"});
			}
		}).catch( err => {
			return res.status(500).json({message: "Internal Server Error"});
		})
	}).catch(err => {
		return res.status(500).json({message: "Internal Server Error"});
	})
});

app.post('/api/login', jsonParser, (req, res) => {
	let {email, password} = req.body;
	UserList.getByEmail(email).then( user => {
		if(user.length == 0) {
			res.statusMessage = "User or password is incorrect";
			return res.status(401).json({
				message : "User or password is incorrect",
				status : 401
			});
		}
		bcrypt.compare(password, user[0].password).then( response => {
			if(response) {
				return res.status(200).json({
					message: "Success",
					status: 201
				});
			}
			res.statusMessage = "User or password is incorrect";
			return res.status(401).json({
				message : "User or password is incorrect",
				status : 401
			}); 
		}).catch(err => {
			res.statusMessage = "Internal Server Error"
			return res.status(500).json({
				message : "Internal Server Error",
				status : 500
			});	
		});
	}).catch( error => {
		console.log(error);
		res.statusMessage = "Internal Server Error"
		return res.status(500).json({
			message : "Internal Server Error",
			status : 500
		});
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
	let {email, name, allottedTime} = req.body;

	UserList.postCourse(email, {name, allottedTime, spentTime: 0}).then(response => {
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
	let {email, course} = req.body;
	UserList.putCourse(email, course).then( response => {
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
		return res.status(202).json(response);
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
	let {email, name, id} =  req.body;
	UserList.deleteTask(email, name, id).then( response => {
		console.log(response);
		return res.status(200).json(response);
	}).catch(error => {
		console.log(error);
		return res.status(500).json(error);
	})
});

app.put('/api/updateTask', jsonParser, (req, res) => {
	let {email, name, task} = req.body;
	UserList.updateTask(email, name, task)
			.then(response => {
				console.log(response);
				return res.status(200).json(response);
			})
			.catch(error => {
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

app.post('/api/createHistory', jsonParser, (req, res) => {
	let {email, name, pomodoroCount} = req.body;

	UserList.createHistory(email, {name, pomodoroCount}).then(response => {
		console.log(response);
		if(response == 404)  {
			res.statusMessage = "User not found";
			return res.status(404).json({message: "User not found"});
		}
		if(response == 409) {
			res.statusMessage = "History already exists";
			return res.status(409).json({message: "History already exists"});
		}
		return res.status(200).json(response);
	}).catch( err => {
		console.log(err);
		return res.status(500).json(err);
	})
});

app.put('/api/updateHistory', jsonParser, (req, res) => {
	let { email, name } = req.body;
	UserList.updateHistory(email, name).then( response => {
		return res.status(200).json(response);
	}).catch(err => {
		return res.status(500).json(err);
	})
});

app.delete('/api/deleteHistory', jsonParser, (req, res) => {
	let {email, name} = req.body;
	UserList.deleteHistory(email, name).then( response => {
		return res.status(202).json(response);
	}).catch(err => {
		console.log(err);
		return res.status(500).json(err);
	})
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
