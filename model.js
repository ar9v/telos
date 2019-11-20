let mongoose = require('mongoose');

mongoose.Promise = global.Promise;

let taskSchema = mongoose.Schema({
	description: { type : String },
	complete: { type : Boolean }
});

let historySchema = mongoose.Schema({
	name: { type : String },
	pomodoroCount: { type : Number }
});

let courseSchema = mongoose.Schema({
	name: { type : String, require : true },
	allottedTime: { type : Number },
	spentTime: { type : Number},
	tasks: [taskSchema]
});

let pomodoroSchema = mongoose.Schema({
	workLength: { type : Number },
	breakLength: { type : Number },
	longBreakLength: { type : Number }
});

let usersSchema = mongoose.Schema({
	email: { type : String, require : true },
	password: { type : String, require : true },
	courses: [courseSchema],
	history: [historySchema],
	pomodoro: pomodoroSchema
});

let User = mongoose.model( 'User', usersSchema );

let UserList = {
	getByEmail : function(email) {
		return User.find({email: email}).then(foundUser => {
			return foundUser;
		}).catch(error => {
			throw Error(error);
		});
	},
	postUser : function(newUser) {
		return User.find({email: newUser.email}).then(userList => {
			if (userList.length == 0) {
				return User.create(newUser).then(user => {
					return user;
				}).catch(function(error) {
					throw Error(error);
				});
			}
			return 409;
		}).catch(error => {
			throw Error(error);
		});
	},
	postCourse : function(email, newCourse) {
		return User.find({email: email, 'courses.name': newCourse.name}).then( userList => {
			if (userList.length == 0) {
				return User.findOneAndUpdate({email: email},
											{$push: {courses: newCourse}}, 
											{ new: true })
				.then( user => {
					if (user == null) {
						return 404;
					}
					return user.courses[user.courses.length - 1];
				}).catch(error => {
					throw Error(error);
				});
			}
			return 409;
		})
	},
	putCourse : function(email, course) {
		return User.findOneAndUpdate({email: email, 'courses.name': course.name}, 
									{ $set: {'courses.$': course}}, 
									{ new: true })
		.then( user => {
			if (user == null) {
				return 404;
			}
			return user //We could filter out and return only the course we updated.
		})
		.catch(error => {
			throw Error(error);
		});
	},
	deleteCourse : function(email, name) {
		return User.findOneAndUpdate({email: email}, {$pull: { courses: {name: name}}}).then( () => {
			return 202;
		}).catch(error => {
			throw Error(error);
		});
	},
	createTask : function(email, courseName, task) {
		return User.findOneAndUpdate({email: email, 'courses.name': courseName}, 
									{$push: {'courses.$.tasks': task}}, 
									{ new: true})
		.then( response => {
			if(response == null) {
				return 404;
			}
			return response;
		}).catch(error => {
			throw Error(error);
		})
	},
	deleteTask : function(email, courseName, taskId) {
		return User.findOneAndUpdate({email, 'courses.name': courseName}, 
									{$pull: {'courses.$.tasks': {_id: taskId}}}, 
									{new: true})
		.then(response => {
			return response;
		}).catch( error => {
			return error;
		})
	},
	updateTask: function(email, courseName, task) {
		console.log(task);
		return User.updateOne({email, 'courses.name': courseName},
						   {$set: {"courses.$[cname].tasks.$[task].complete": task.complete}},
						   {arrayFilters: [{"cname.name": courseName}, {"task._id": task._id}]})
				   .then(response => response)
				   .catch(error => error);
	},
	updatePomodoro : function(email, pomodoro) {
		//Programtically create the set object
		// var set = {};
		// for(var key in pomodoro){ 
		//   pomodoro[key] !== "" ? set['pomodoro.$.' + key] = pomodoro[key] : null;
		// }
		// console.log(set);
		return User.findOneAndUpdate({email: email}, 
									{$set: {pomodoro: pomodoro}},
									{new: true})
		.then( response => {
			return response;
		})
		.catch(error => {
			return error;
		});
	},
	createHistory : function(email, newHist) {
		return User.find({email: email, 'history.name': newHist.name}).then( userList => {
			if (userList.length == 0) {
				return User.findOneAndUpdate({email: email},
											{$push: {history: newHist}},
											{ new: true })
				.then( user => {
					if (user == null) {
						return 404;
					}
					return user.history[user.history.length - 1];
				}).catch(error => {
					throw Error(error);
				});
			}
			return 409;
		})
	},
	updateHistory : function(email, name) {
		return User.findOneAndUpdate({email: email, 'history.name': name}, 
									{$inc: {'history.$.pomodoroCount': 1}})
		.then( response => {
			return resposne;
		}).catch( error => {
			return error;
		})
	}

}

module.exports = {  UserList };
