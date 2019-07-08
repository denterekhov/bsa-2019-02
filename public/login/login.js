document.addEventListener('DOMContentLoaded', () => {

    const loginBtn = document.querySelector('#submit-btn');
    const loginField = document.querySelector('#login-field');
    const pwField = document.querySelector('#pw-field');

    loginBtn.addEventListener('click', e => {
        e.preventDefault();
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: loginField.value,
                password: pwField.value
            })
        }).then(res => {
            res.json().then(body => {
                if (body.auth) {
                    localStorage.setItem('jwt', body.token);
                    location.replace('/currentRace');
                } else {
                    console.log('auth failed');
                }
            })
        }).catch(err => {
            console.log('request went wrong');
        })
    });

});
