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

let email = window.sessionStorage.getItem("email");
if(!email) {
    window.alert("Please log in.");
    window.location.href = '/';
};

//// We must obtain a user's information to populate the dashboard
$.ajax({
    url: '/api/User',
    data: { email: email },
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
    let header = $(`<header class='w3-container'>
                      <span class='delCourse w3-button'>
                         &times;
                      </span>'`);
    let cname = $(`<h3>${course.name}</h3>`);
    let percentage = $(`<span class="percentage">
                            ${course.spentTime / course.allottedTime * 100}%
                        </span>`);
    let progress = $('<div class="progress-bar"></div>');
    progress.width(`${percentage}%`);
    let div = $('<div class="course w3-animate-opacity"></div>')
    div.append(header, cname, percentage, progress);
    return div;
}

function loadCourses() {
    userContext.courses.forEach(course => $(".courses-display").append(createCourseHTML(course)));
}

function createHistoryHTML(hist) {
    let header = $(`<header class='w3-container'>
                      <span class='delCourse w3-button'>
                         &times;
                      </span>'`);
    let hname = $(`<h3>${hist.name}</h3>`);
    let msg = $(`<span>Pomodoro Total</span>`);
    let stat = $(`<span>${hist.pomodoroCount}</span>`);
    let div = $('<div class="history"></div>')
    div.append(header, hname, msg, stat);
    return div;
}

function loadHistory() {
    userContext.history.forEach(hist => $(".history-block").append(createHistoryHTML(hist)));
}

function fetchContext(courseName) {
    let result = userContext.courses.filter(course => course.name == courseName);
    return result[0];
}

function createTaskHTML(task) {
    let item = $(`<span class="item" id=${task._id}>${task.description}</span>`);

    if(task.complete) {
        item.css("text-decoration", "line-through");
    }
    else {
        item.css("text-decoration", "");
    }

    // Create the li
    let listItem = $("<li></li>");

    // Create the buttons
    let deleteButton = $("<button type='button' class='deleteB'>Delete</button>");
    let checkButton = $("<button type='button' class='checkB'>Done</button>");

    // Putting it all together...
    listItem.append(deleteButton, checkButton, item);

    return listItem;
}

function createCourseInfo(course) {
    $("#course-specifics").empty();
    let cname = $(`<h2>Course Stats</h2>`);
    let allottedTime = $(`<h3>Allotted Time: ${course.allottedTime}</h3>`);
    let totalTasks = $(`<h4>Total Tasks: ${course.tasks.length}</h4>`);

    let completed = course.tasks.filter(task => task.complete != false);
    let completedTasks = $(`<h4>Completed Tasks: ${completed.length}</h4>`);
    $("#course-specifics").append(cname, allottedTime, totalTasks, completedTasks);
}

// Front-end interaction
//// Adding propagation of events to child elements
//// Population of course area
$(".courses-display").on("click", ".course", function(event) {
    let courseName = $(this).children("h3").text();
    let course = fetchContext(courseName);

    // Add the course name
    $("#actualCourse").text(`${course.name}`);

    // Add the add task bar
    $("#addTaskBar").css("display", "flex");

    // Clean area
    $("#task-area").empty();

    // Add the existing tasks
    course.tasks.forEach(task => $("#task-area").append(createTaskHTML(task)));

    // Add the course information
    createCourseInfo(course);
});

$("#addTaskButton").on("click", function(event) {
    event.preventDefault();
    let taskText = $("#addTaskText").val();
    let email = userContext.email;
    let name = $("#actualCourse").text();
    let description = taskText;
    let complete = false;
    $("#addTaskText").val("");

    $.ajax({
        url: '/api/createTask',
        contentType: 'application/json',
        data: JSON.stringify({email, name, description}),
        method: 'POST',
        success: function(response) {
            let _id = response._id;
            let newTask = {
                _id,
                description,
                complete
            };

            let course = fetchContext(name);
            course.tasks.push(newTask);
            $("#task-area").append(createTaskHTML(newTask));
            createCourseInfo(course);
        },
        error: function(err) {console.log(err) }
    });
});

$("ul").on("click", ".checkB", function(event) {
    let cssState = $(this).next().css("text-decoration-line");
    let _id = $(this).next().attr("id");
    let email = userContext.email;
    let name = $("#actualCourse").text();
    let course = fetchContext(name);
    let complete = false;

    if(cssState === "line-through") {
        $(this).next().css("text-decoration", "");
    }
    else {
        $(this).next().css("text-decoration", "line-through");
        complete = true;
    }

    // Frontend
    // course.tasks = course.tasks.filter(t => t._id == _id);
    // course.tasks[0].complete = complete;
    course.tasks = course.tasks.map(t => {
        if(t._id == _id)
            return {_id: _id, description: t.description, complete: complete}
        else
            return {_id: t._id, description: t.description, complete: t.complete}
    });

    userContext.courses.forEach(c => {
        if(c.name == name)
            c.tasks = course.tasks;
    });

    // Backend
    $.ajax({
        url: '/api/updateTask',
        contentType: 'application/json',
        data: JSON.stringify({email, name, task: {_id, complete}}),
        method: "PUT",
    });

    createCourseInfo(course);
});

$("ul").on("click", ".deleteB", function(event) {
    let taskId = $(this).siblings("span").attr("id");
    $(this).parent().remove();

    let name = $("#actualCourse").text();
    let course = fetchContext(name);

    // Delete from userContext
    course.tasks = course.tasks.filter(task => task._id != taskId);
    userContext.courses.forEach(c => {
        if(c.name == name)
            c.tasks = course.tasks;
    });
    createCourseInfo(course);

    let email = userContext.email;
    // Delete from mongo
    $.ajax({
        url: '/api/deleteTask',
        contentType: 'application/json',
        data: JSON.stringify({email, name, id: taskId}),
        method: "DELETE",
        success: function(response) {
            console.log("Successful Deletion");
        },
        error: function(err) { console.log(err) }
    });
});

//// Adding and updating courses (CRUD)
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

$(".courses-display").on("click", ".delCourse", function(event) {
    event.stopPropagation();
    let courseName = $(this).parent().parent().children("h3").text();

    // Remove from userContext
    userContext.courses = userContext.courses.filter(c => c.name != courseName);
    $(this).parent().parent().remove();

    // Remove from mongo
    $.ajax({
        url: '/api/deleteCourse',
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({email: userContext.email, name: courseName}),
        success: function(response) {
            window.alert("Course removed successfully");
        },
        error: function(err) {
            window.alert("Course could not be removed. Try again later")
        }
    });
});

$(".history-block").on("click", ".delCourse", function(event) {
    let courseName = $(this).parent().parent().children("h3").text();

    // Remove from userContext
})

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

//// Updating pomodoro settings
$("#savePomodoro").on("click", function(event) {
    event.preventDefault();

    let email = userContext.email;
    let workLength = $("#pomoLength").val();
    let breakLength = $("#bLength").val();
    let longBreakLength = $("#lbLength").val();

    let pomodoro = {workLength, breakLength, longBreakLength};

    // update userContext
    userContext.pomodoro = pomodoro;

    // update mongo
    $.ajax({
        url: '/api/updatePomodoro',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({email, pomodoro}),
        success: function(response) {
            window.alert("Pomodoro settings saved!");
            // Redraw timer
            setTimer();
        },
        error: function(err) {
            console.log(err);
            window.alert("There was an error.. Please try again later");
        }
    });
});
