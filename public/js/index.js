function showAlert(message, color='#111') {
    $.toast({ 
      text : "<div class='alert'>" + message + "</div>", 
      showHideTransition : 'slide',  // It can be plain, fade or slide
      bgColor : color,              // Background color for toast
      textColor : 'whitesmoke',            // text color
      hideAfter : 4000,              // `false` to make it sticky or time in miliseconds to hide after
      stack : 5,                     // `fakse` to show one stack at a time count showing the number of toasts that can be shown at once
      textAlign : 'left',            // Alignment of text i.e. left, right, center
      position : 'top-right'        // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values to position the toast on page
    });
}

$('#signup').on('click', (event) => {
    event.preventDefault();

    let email = $("#email").val();
    let password = $("#password").val();

    // Is a field empty?
    if(!email | !password) {
        showAlert("A field is empty. Please write both your email and password.")
        return;
    }

    if(!email.match(/[a-zA-Z0-9-_.+]+@[a-zA-Z]+\.[a-zA-Z]+/g)) {
        showAlert("Please enter a valid email address");
        return;
    }

    $.ajax({
        url: '/api/register',
        contentType: 'application/json',
        data: JSON.stringify({email, password}),
        method: "POST",
        success: function(response) {
            // Does the user exist?
            if(response == 409)
                showAlert("User already exists", '#cf5353');
            else
                showAlert("User created successfully");
        },
        error: function(err) {
            showAlert(err.statusText);
        }
    });
});

$('#login').on('click', (event) => {
    event.preventDefault();

    let email = $("#email").val();
    let password = $("#password").val();

    // Is a field empty?
    if(!email | !password) {
        showAlert("A field is empty. Please write both your email and password.", '#cf5353');
        return;
    }
    if(!email.match(/[a-zA-Z0-9-_.+]+@[a-zA-Z]+\.[a-zA-Z]+/g)) {
        showAlert("Please enter a valid email address", '#cf5353');
        return;
    }
    $.ajax({
        url: '/api/login',
        contentType: 'application/json',
        data: JSON.stringify({email, password}),
        method: "POST",
        success: function(response) {
            sessionStorage.setItem('email', email);
            window.location.href = '/dashboard';
        },
        error: function(err) {
            showAlert(err.statusText, '#cf5353');
        }
    })
})

