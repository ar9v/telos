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
	allotedTime: { type : Number },
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
	history: historySchema,
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
		return User.findOneAndUpdate({email: email}, {$push: {courses: newCourse}}, { new: true }).then( user => {
			if (user == null) {
				return 404;
			}
			return user.courses[user.courses.length - 1];
		}).catch(error => {
			throw Error(error);
		});
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
	}

}

module.exports = {  UserList };