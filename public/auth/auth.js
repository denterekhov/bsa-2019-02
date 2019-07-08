document.addEventListener('DOMContentLoaded', () => {

    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        location.replace('/currentRace');
    } else {
        location.replace('/login');
    }

});
