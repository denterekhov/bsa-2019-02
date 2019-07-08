document.addEventListener('DOMContentLoaded', () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        location.replace('/login');
    } else {
        const socket = io.connect();

        const second = 1000,
        minute = second * 60;

        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            socket.emit('user disconnected', { token: jwt });
        });

        socket.emit('user logged', { token: jwt });
        socket.emit('first race');

        socket.on('start race', ({distance: time, racers, randomText}) => {
            let randomTextLength,
                currentPosition = 0,
                userCurrentProgress;
            randomTextLength = randomText.length;

            document.body.innerHTML = 
            `<div class="container">
                <div class="text">
                    <span id='text'>${randomText}</span>
                </div>
                <h4 id='timeToRaceEnd'></h4>
            </div>`;

            const container = document.querySelector('.container');
            const timeToRaceEnd = document.getElementById('timeToRaceEnd');

            Object.keys(racers).forEach(racerName => {
                const userProgress = 
                    `<div class="userProgress">
                        <p class='username'>${racerName}</p>
                        <progress class='currentProgressMeter' value="${racers[racerName]}" max="100"></progress>
                        <p class='progress'>${racers[racerName]}</p>
                    </div>`;
                container.insertAdjacentHTML('afterBegin', userProgress);
            });

            let timerId = setInterval(() => {
                time -= second;
                let mm = Math.floor(time / minute);
                let ss = Math.floor(time / 1000 % 60);
                let timeLeft = ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2);
                timeToRaceEnd.textContent = `${timeLeft} until the end`;

                if(time <= 0) {
                    clearInterval(timerId);
                    document.removeEventListener('keypress', typing);
                };
            }, second);

            const typing = (e) => {
                if (e.key === randomText.charAt(currentPosition)) {
                    currentPosition++;
                    text.innerHTML = 
                        `<span style="color: #0f0">${randomText.substring(0, currentPosition)}</span>` + 
                        `<span style="color: #f00">${randomText.charAt(currentPosition)}</span>` + 
                        randomText.substring(currentPosition + 1);
    
                    userCurrentProgress = +((currentPosition/randomTextLength * 100).toFixed(1));
                    socket.emit('current progress', { userCurrentProgress, token: jwt });
                }
            };
            document.addEventListener('keypress', typing);
        });

        socket.on('update progress', ( racers ) => {
            const sortedUsers = Object.keys(racers).sort((a, b) => racers[b] - racers[a]);
            [...document.querySelectorAll('.userProgress')].forEach((el, ind) => {
                el.querySelector('.username').textContent = sortedUsers[ind];
                racers[sortedUsers[ind]] !== 'Offline' 
                    ? el.querySelector('.currentProgressMeter').value = racers[sortedUsers[ind]]
                    : el.querySelector('.currentProgressMeter').classList.add("redprogressbar");
                el.querySelector('.progress').textContent = racers[sortedUsers[ind]];
            })
        });

        socket.on('stop race', ({ distance: time }) => {
            if (document.querySelector('.text')) {
                document.querySelector('.text').remove();
            }
            document.getElementById('timeToRaceEnd').remove();
            document.body.insertAdjacentHTML('beforeEnd', "<h3 id='timeToNextRace'></h3>");
            const timeToNextRace = document.getElementById('timeToNextRace');
            
            let timerId = setInterval(() => {
                time -= second;
                let mm = Math.floor(time / minute);
                let ss = Math.floor(time / 1000 % 60);
                let timeLeft = ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2);
                timeToNextRace.textContent = `The next race starts in: ${timeLeft}`;

                if(time <= 0) {
                    timeToNextRace.textContent = 'The next race starts in: 00:00';
                    clearInterval(timerId);
                };
            }, second);
        });

        socket.on('first race', ({ distance: time, isRaceRunning }) => {
            const timeToNextRace = document.getElementById('timeToNextRace');

            const timerId = setInterval(() => {
                time -= second;
                let mm = Math.floor(time / minute);
                let ss = Math.floor(time / 1000 % 60);
                let timeLeft = ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2);
                timeToNextRace.textContent = isRaceRunning 
                    ? `The current race is in progress. It will end in ${timeLeft}`
                    : `The next race starts in: ${timeLeft}`;

                if(time <= 0) {
                    timeToNextRace.textContent = isRaceRunning 
                        ? 'The current race is in progress. It will end in 00:00'
                        : 'The next race starts in: 00:00';
                    clearInterval(timerId);
                    if(isRaceRunning) {
                      socket.emit('first race');
                    }
                };
            }, second);
        });
    }
});
