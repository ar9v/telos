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

let pomodoroCycle = 1;
let pomodoroTimer;

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
    setPomodoro();
    loadConfig();
    loadCourses();
    loadHistory();
}

function setPomodoro() {
    console.log('Podomoro Cycle:' + pomodoroCycle);
    var Timer = $('#timer');
    var time = 0;
    let cycle = pomodoroCycle % 8;
    if(cycle == 0) {
        //Long Break
        time = userContext.pomodoro.longBreakLength;
        //Add time and counter to current course
    } else if(cycle % 2 == 1) {
        //Work Time
        time = userContext.pomodoro.workLength;
    } else {
        //Short Break
        time = userContext.pomodoro.breakLength;
        //Add time and counter to current course
    }
    
    var Minutes = time;
    var Seconds = 0;
        
    Timer.html( 
        (Minutes < 10 ? '0' : '') + Minutes 
        + ':' 
        + (Seconds < 10 ? '0' : '') + Seconds );

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
                            ${(course.spentTime / (course.allottedTime * 60) * 100).toFixed(2)}%
                        </span>`);
    let progress = $('<div class="progress-bar"></div>');
    progress.width(course.spentTime / (course.allottedTime * 60) * 100 + '%');
    let div = $('<div class="course w3-animate-opacity"></div>')
    div.append(header, cname, percentage, progress);
    return div;
}

function loadCourses() {
    $(".courses-display").empty();
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
    $(".history-block").empty();
    userContext.history.forEach(hist => $(".history-block").append(createHistoryHTML(hist)));
}

function fetchContext(courseName) {
    let result = userContext.courses.filter(course => course.name == courseName);
    return result[0];
}
function fetchContextH(courseName) {
    let result = userContext.history.filter(h => h.name == courseName);
    console.log(result[0]);
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

/// Logout
$("#logout").on("click", event => {
    sessionStorage.removeItem("email");
    window.location.href = "/";
})


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
            return t
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

function updateCourse(email, course) {
}

$("#updateCourse").on("click", event => {
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
    let updatedCourse = fetchContext(name);
    updatedCourse.allottedTime = allottedTime;

    //Update User Context
    userContext.courses = userContext.courses.map(c => {
        if(c.name == name) 
            return updatedCourse;
        else
            return c
    });

    // Update in Database
    $.ajax({
        url: '/api/updateCourse',
        contentType: 'application/JSON',
        data: JSON.stringify({email, course: updatedCourse}),
        method: "PUT",
        success: function(response) {
            loadCourses();
            window.alert("The course was updated successfully");
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

})

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
    event.stopPropagation();
    let courseName = $(this).parent().parent().children("h3").text();

    // Remove from userContext
    userContext.history = userContext.history.filter(h => h.name != courseName);
    $(this).parent().parent().remove();

    // Remove from mongo
    $.ajax({
        url: '/api/deleteHistory',
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({email: userContext.email, name: courseName}),
        success: function(response) {
            window.alert("History removed successfully");
        },
        error: function(err) {
            window.alert("History could not be removed. Try again later")
        }
    });
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

$('#stop').on('click', function() {
    let StartB = $('#start').show();
    let StopB = $('#stop').hide();
    clearInterval(pomodoroTimer);
    setPomodoro();
});

$('#start').on('click', function() {
    let Timer = $('#timer');
    let StartB = $('#start').hide();
    let StopB = $('#stop').show();
    let time = 0;
    let cycle = pomodoroCycle % 8;
    if(cycle == 0) {
        //Long Break
        time = userContext.pomodoro.longBreakLength;
    } else if(cycle % 2 == 1) {
        //Work Time
        time = userContext.pomodoro.workLength;
    } else {
        //Short Break
        time = userContext.pomodoro.breakLength;
    }
    time = time * 1000 * 60;
    //Actual Timer Start
    pomodoroTimer = setInterval(function() {
        if(time <= 0){
            clearInterval(pomodoroTimer);
            //Do something
            StartB.show();
            StopB.hide();
            pomodoroCycle = pomodoroCycle + 1;
            setPomodoro();
            //Update Courses
            if(cycle % 2 == 1) {
                let courseName = $('#actualCourse').text();
                let course = fetchContext(courseName);
                course.spentTime = course.spentTime + userContext.pomodoro.workLength;

                userContext.courses = userContext.courses.map(c => {
                    if(c.name == courseName)
                        return course
                    else
                        return c
                });
                
                $.ajax({
                    url: '/api/updateCourse',
                    contentType: 'application/JSON',
                    data: JSON.stringify({email, course}),
                    method: "PUT",
                    success: function(response) {
                        loadCourses();

                        // Update History
                        historyResult = fetchContextH(courseName);
                        console.log(historyResult);
                        historyResult.pomodoroCount = historyResult.pomodoroCount + 1;

                        userContext.history = userContext.history.map(h => {
                            if(h.name == courseName)
                                return historyResult;
                            else
                                return h
                        });

                        $.ajax({
                            url: '/api/updateHistory',
                            contentType: 'application/JSON',
                            data: JSON.stringify({email, name: historyResult.name, pomodoroCount: historyResult.pomodoroCount}),
                            method: "PUT",
                            success: response => {
                                loadHistory();
                            },
                            error: err => {
                                window.alert("Server Error: Please try again later");
                            }
                        })

                    },
                    error: function(err) {
                        window.alert("Server Error: Please try again later");
                    }
                });
            }
        } else {
            time = time - 1000;
            let Minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
            let Seconds = Math.floor((time % (1000 * 60)) / 1000);
                
            Timer.html( (Minutes < 10 ? '0' : '') + Minutes + ':' + (Seconds < 10 ? '0' : '') + Seconds );
        }
    },1000)
});

//// Updating pomodoro settings
$("#savePomodoro").on("click", function(event) {
    event.preventDefault();

    let email = userContext.email;
    let workLength = parseInt($("#pomoLength").val());
    let breakLength = parseInt($("#bLength").val());
    let longBreakLength = parseInt($("#lbLength").val());

    let pomodoro = {workLength, breakLength, longBreakLength};
    console.log(pomodoro);

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
            setPomodoro();
        },
        error: function(err) {
            console.log(err);
            window.alert("There was an error.. Please try again later");
        }
    });
});

