const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bodyParser = require('body-parser');
const users = require('./data/users.json');
const texts = require('./data/texts.js');

require('./passport.config');

server.listen(3001);

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/auth/auth.html'));
});

app.get('/currentRace', /*passport.authenticate('jwt'),*/ function (req, res) {
  res.sendFile(path.join(__dirname, 'public/currentRace/currentRace.html'));
});

app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/login/login.html'));
});

app.post('/login', function (req, res) {
  const userFromReq = req.body;
  const userInDB = users.find(user => user.login === userFromReq.login);

  if (userInDB && userInDB.password === userFromReq.password) {
    const token = jwt.sign(userFromReq, 'supermegasecretkey', { expiresIn: '365d' });
    res.status(200).json({ auth: true, token });
  } else {
    res.status(401).json({ auth: false });
  }
});

let isRaceRunning = false;
const racers = {};

let distance = 120000;
let clearTimerId; 

io.on('connection', socket => {
    const raceTimer = () => {
        let countDown = Date.now() + 120000;
        clearTimerId = setInterval(() => {
            let now = Date.now();
            distance = countDown - now;
            
            if(distance <= 0) {
                clearInterval(clearTimerId);
                raceTimer();
                isRaceRunning = !isRaceRunning;

                if (isRaceRunning) {
                    const randomText = texts[Math.floor(Math.random() * texts.length)];

                    Object.keys(racers).forEach(key => {
                        racers[key] = '0.0';
                    })
                    io.emit('start race', { distance: 120000, racers, randomText });
                } else {
                    Object.keys(racers).forEach(key => {
                        if(racers[key] === 'Offline') {
                            delete racers[key];
                        }
                    })
                    io.emit('stop race', { distance: 120000 });
                }
            };
            if (!socket.conn.server.clientsCount) {
                clearInterval(clearTimerId);
            }
        }, 1);
    };

    socket.on('user logged', ({ token }) => {
        const userLogin = jwt.decode(token).login;
        racers[userLogin] = '0.0';

        if (socket.conn.server.clientsCount === 1) {
            if(clearTimerId) clearInterval(clearTimerId);
            raceTimer();
        } 
    });
  
    socket.on('first race', () => {
        socket.emit('first race', { distance, isRaceRunning });
    });
  
    socket.on('current progress', ({ userCurrentProgress, token }) => {
        const { login } = jwt.verify(token, 'supermegasecretkey');
        if (login) {
            racers[login] = userCurrentProgress;
            io.emit('update progress', racers);
        }
    });

    socket.on('user disconnected', ({ token }) => {
        const userLogin = jwt.decode(token).login;
        racers[userLogin] = 'Offline';
    });
});
