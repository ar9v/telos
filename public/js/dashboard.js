var userContext = {
    email: "",
    courses: [],
    history: [],
    pomodoro: {
        workLength: 0,
        breakLength: 0,
        longBreakLength: 0,
    },
    timer: {
        mins: 0,
        sec: 0
    },
    pomodoroCount: 0
};

// We must obtain a user's information to populate the dashboard
$.ajax({
    url: '/api/User',
    data: { email: "aricav96@gmail.com" },
    dataType: "json",
    method: "GET",
    success: function(response) {
        // Response should be the Mongo array
        // hence the index
        setUserContext(response[0]);
        populate();
    },
    error: function(err) { console.log(err) }
});

function setUserContext(mongoUser) {
    userContext.email = mongoUser.email;
    mongoUser.courses.forEach(course => userContext.courses.push(course));
    mongoUser.history.forEach(hist => userContext.history.push(hist));
    userContext.pomodoro.workLength = mongoUser.pomodoro.workLength;
    userContext.pomodoro.breakLength = mongoUser.pomodoro.breakLength;
    userContext.pomodoro.longBreakLength = mongoUser.pomodoro.longBreakLength;
}

function populate() {
    setTimer();
    // loadConfig();
    // loadCourses();
    // loadHistory();
}

function setTimer() {
    let cycleState = userContext.pomodoroCount % 8;

    if(cycleState == 7)
        userContext.timer.mins = userContext.pomodoro.longBreakLength;
    else if(cycleState % 2 == 0)
        userContext.timer.mins = userContext.pomodoro.workLength;
    else
        userContext.timer.mins = userContext.pomodoro.breakLength;

    $("#timer").text(`${userContext.timer.mins}m ${userContext.timer.sec}s`)
}

// function loadConfig() {

// }
