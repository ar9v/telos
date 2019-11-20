$('#signup').on('click', (event) => {
    event.preventDefault();

    let email = $("#email").val();
    let password = $("#password").val();

    // Is a field empty?
    if(!email | !password) {
        window.alert("A field is empty. Please write both your email and password.")
        return;
    }

    if(!email.match(/[a-zA-Z0-9-_.+]+@[a-zA-Z]+\.[a-zA-Z]+/g)) {
        window.alert("Please enter a valid email address");
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
                window.alert("User already exists");
            else
                window.confirm("User created successfully");
        },
        error: function(err) {
            window.alert(err.statusText);
        }
    });
});

$('#login').on('click', (event) => {
    event.preventDefault();

    let email = $("#email").val();
    let password = $("#password").val();

    // Is a field empty?
    if(!email | !password) {
        window.alert("A field is empty. Please write both your email and password.")
        return;
    }
    if(!email.match(/[a-zA-Z0-9-_.+]+@[a-zA-Z]+\.[a-zA-Z]+/g)) {
        window.alert("Please enter a valid email address");
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
            window.alert(err.statusText);
        }
    })
})

