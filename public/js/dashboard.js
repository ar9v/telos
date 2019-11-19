// Setup
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

//// We must obtain a user's information to populate the dashboard
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
    loadConfig();
    loadCourses();
    loadHistory();
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

function loadConfig() {
    $("#pomoLength").val(userContext.pomodoro.workLength);
    $("#bLength").val(userContext.pomodoro.breakLength);
    $("#lbLength").val(userContext.pomodoro.longBreakLength);
}

function createCourseHTML(course) {
    let cname = $(`<h3>${course.name}</h3>`);
    let percentage = $(`<span class="percentage">
                            ${course.spentTime / course.allottedTime * 100}%
                        </span>`);
    let progress = $('<div class="progress-bar"></div>');
    progress.width(`${percentage}%`);
    let div = $('<div class="course"></div>')
    div.append(cname, percentage, progress);
    return div;
}

function loadCourses() {
    userContext.courses.forEach(course => $(".courses-display").append(createCourseHTML(course)));
}

function createHistoryHTML(hist) {
    let hname = $(`<h3>${hist.name}</h3>`);
    let msg = $(`<span>Pomodoro Total</span>`);
    let stat = $(`<span>${hist.pomodoroCount}</span>`);
    let div = $('<div class="history"></div>')
    div.append(hname, msg, stat);
    return div;
}

function loadHistory() {
    userContext.history.forEach(hist => $(".history-block").append(createHistoryHTML(hist)));
}

function fetchContext(courseName) {
    let result = userContext.courses.filter(course => course.name == courseName);
    return result[0];
}

// Front-end interaction
//// Adding propagation of events to child elements
$(".courses-display").on("click", ".course", function(event) {
    let courseName = $(this).children("h3").text();
    let course = fetchContext(courseName);

    $("#currentCourse").text(`Course: ${course.name}`);
});

//// Adding courses
$("#addCourse").on("click", (event) => {
    event.preventDefault();

    let email = userContext.email;
    let name = $("#courseName").val();
    let allottedTime = $("#allottedTime").val();

    // Clean up the inputs
    $("#courseName").val("");
    $("#allottedTime").val("");

    if(!name || !allottedTime) {
        window.alert("At least one field is missing. Please try again");
        return;
    }

    // Add to userContext
    let newCourse = {
        name,
        allottedTime,
        spentTime: 0,
        tasks: []
    };

    let newHist = {
        name,
        pomodoroCount: 0
    };

    // Upload to database
    $.ajax({
        url: '/api/createCourse',
        contentType: 'application/json',
        data: JSON.stringify({email, name, allottedTime}),
        method: "POST",
        success: function(response) {
            userContext.courses.push(newCourse);
            $(".courses-display").append(createCourseHTML(newCourse));
            addHistory(newHist)
            window.confirm("The course was created successfully");
        },
        error: function(err) {
            if(err.status == 404)
                window.alert("The user doesn't exist");
            else if(err.status == 409)
                window.alert("The course already exists");
            else
                window.alert("Server Error: Please try again later");
        }
    });
});

function addHistory(hist) {
    let email = userContext.email;
    let name = hist.name;
    let pomodoroCount = hist.pomodoroCount;

    $.ajax({
        url: '/api/createHistory',
        contentType: 'application/json',
        data: JSON.stringify({email, name, pomodoroCount}),
        method: "POST",
        success: function(response) {
            // Add it to front-end
            userContext.history.push(hist);
            $(".history-block").append(createHistoryHTML(hist));
        },
        error: function(err) {
            if(err.status == 404)
                console.log("The user doesn't exist");
            else if(err.status == 409)
                console.log("The course history already exists");
            else
                console.log("Server Error: Please try again later")
        }
    });
}
