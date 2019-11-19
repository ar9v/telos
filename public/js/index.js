$('#signup').on('click', (event) => {
    event.preventDefault();

    let email = $("#email").val();
    let password = $("#password").val();

    // Is a field empty?
    if(!email | !password) {
        window.alert("A field is empty. Please write both your email and password.")
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
        error: function(err) { console.log(err) }
    });
});
