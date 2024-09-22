let timer_start, timer_game, timer_finish, timer_time, good_positions, wrong, right, speed, timerStart, positions, timerFill;
let game_started = false;
let streak = 0;
let max_streak = 0;
let best_time = 99.999;

let mode = 6;
let mode_data = {};
mode_data[5] = [8, '104px'];
mode_data[6] = [10, '86px'];
mode_data[7] = [11, '73px'];
mode_data[8] = [12, '63.5px'];
mode_data[9] = [13, '56px'];
mode_data[10] = [15, '50px'];

// Get max streak from cookie
const regex = /max-streak_thermite=([\d]+)/g;
let cookie = document.cookie;
if ((cookie = regex.exec(cookie)) !== null) {
    max_streak = cookie[1];
}
// Get best time from cookie
const regex_time = /best-time_thermite=([\d.]+)/g;
cookie = document.cookie;
if ((cookie = regex_time.exec(cookie)) !== null) {
    best_time = parseFloat(cookie[1]);
}

const sleep = (ms, fn) => {
    return setTimeout(fn, ms);
};

const range = (start, end, length = end - start + 1) => {
    return Array.from({ length }, (_, i) => start + i);
};

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
};

// Options
document.querySelector('#speed').addEventListener('input', function (ev) {
    document.querySelector('.speed_value').innerHTML = ev.target.value + 's';
    speed = parseFloat(ev.target.value) * 1000; // Convert to milliseconds
    resetToIntro(); // Reset to intro screen and restart game
});
document.querySelector('#grid').addEventListener('input', function (ev) {
    document.querySelector('.grid_value').innerHTML = ev.target.value + 'x' + ev.target.value;
    mode = ev.target.value;
    resetToIntro(); // Reset to intro screen and restart game
});

// Resets
document.querySelector('.btn_again').addEventListener('click', function () {
    resetToIntro(); // Reset to intro screen
});

let current_phase = 0;
let player_sequence = [];
let showing_sequence = false;
let last_highlighted_tile = null;
let timer_phase;

// Define BGM elements
const introBgm = new Audio('intro_bgm.mp3'); // Replace with your intro BGM file
const phaseCompletionBgm = new Audio('phase_completion_bgm.mp3'); // Replace with your phase completion BGM file
const errorBgm = new Audio('error_bgm.mp3'); // Replace with your error BGM file

// Initialize phase completion BGM
phaseCompletionBgm.volume = 0.5; // Adjust volume if necessary

function listener(ev) {
    if (!game_started || showing_sequence) return;

    const position = parseInt(ev.target.dataset.position);
    player_sequence.push(position);

    if (good_positions[player_sequence.length - 1] !== position) {
        triggerError(); // Call the error function
    } else {
        highlightTile(ev.target);

        if (player_sequence.length === current_phase + 1) {
            right++;
            current_phase++;
            player_sequence = [];
            last_highlighted_tile = null;
            stopTimer(); // Stop all timers immediately on success
            if (current_phase < good_positions.length) {
                showPhaseSequence();
            } else {
                check();
            }

            // Play phase completion BGM
            playPhaseCompletionBgm();
        }
    }
}

function highlightTile(tile) {
    tile.classList.add('click');
    setTimeout(() => {
        tile.classList.remove('click');
    }, 200); // Highlight for 0.2 seconds
}

function toggleTilesColor() {
    const blocks = document.querySelectorAll('.group');
    let toggleCount = 0;
    const toggleInterval = setInterval(() => {
        blocks.forEach(block => {
            block.classList.toggle('bad');
        });
        toggleCount++;
        if (toggleCount >= 5) { // Adjust number of toggles as needed
            clearInterval(toggleInterval);
            blocks.forEach(block => {
                block.classList.remove('bad');
            });
        }
    }, 200); // Adjust speed of toggling here (200ms for example)
}

function playPhaseCompletionBgm() {
    phaseCompletionBgm.currentTime = 0; // Restart BGM if already playing
    phaseCompletionBgm.play();
}

function playErrorBgm() {
    errorBgm.currentTime = 0; // Restart BGM if already playing
    errorBgm.play();
}

function triggerError() {
    wrong++;
    game_started = false; // End the game on incorrect guess
    stopTimer(); // Stop all timers
    check();

    // Play error BGM on wrong guess
    playErrorBgm();

    // Toggle tiles color (red and green alternately)
    toggleTilesColor();
}

function check() {
    if (current_phase === good_positions.length) {
        stopTimer(); // Stop all timers
        streak++;
        if (streak > max_streak) {
            max_streak = streak;
            document.cookie = "max-streak_thermite=" + max_streak;
        }
        let time = document.querySelector('.streaks .time').innerHTML;
        if (parseFloat(time) < best_time) {
            best_time = parseFloat(time);
            document.cookie = "best-time_thermite=" + best_time;
        }
        let leaderboard = new XMLHttpRequest();
        leaderboard.open("HEAD", 'streak.php?streak=' + streak + '&max_streak=' + max_streak
            + '&speed=' + speed + '&mode=' + mode + '&time=' + time);
        leaderboard.send();

        // Play phase completion BGM
        playPhaseCompletionBgm();

        // Show splash screen and play intro BGM
        setTimeout(() => {
            document.querySelector('.groups').classList.add('hidden');
            document.querySelector('.splash').classList.remove('hidden');
            introBgm.play();
            
            // Reset back to 1st phase
            resetToIntro();
        }, 1000); // Delay before showing the splash screen and playing the intro BGM
    }
}

function showPhaseSequence() {
    let blocks = document.querySelectorAll('.group');
    let index = 0;
    showing_sequence = true;

    function showNextTile() {
        if (index > 0) {
            blocks[good_positions[index - 1]].classList.remove('good');
        }
        if (index <= current_phase) {
            blocks[good_positions[index]].classList.add('good');
            setTimeout(() => {
                blocks[good_positions[index]].classList.remove('good');
                index++;
                showNextTile();
            }, 300); // Show each tile for 0.3 seconds (adjust as needed)
        } else {
            // Delay before starting the next phase
            setTimeout(() => {
                showing_sequence = false;
                game_started = true; // Allow the game to continue for the next guess
                resetTimer();
                startTimer();
                startPhaseTimer(); // Start the phase timer here
            }, 1000); // Delay 1 second after completing the current phase
        }
    }

    // Start showing the tiles after a short delay
    setTimeout(() => {
        showNextTile();
    }, 2000); // Delay 2 seconds before showing the first tile of the current phase
}

function addListeners() {
    document.querySelectorAll('.group').forEach(el => {
        el.addEventListener('mousedown', listener);
    });
}

function start() {
    wrong = 0;
    right = 0;
    current_phase = 0;
    player_sequence = [];
    last_highlighted_tile = null;

    positions = range(0, Math.pow(mode, 2) - 1);

    good_positions = []; // Initialize good_positions

    let total_phases = mode_data[mode][0]; // Get the total number of phases

    // Instead of slicing, allow tiles to repeat across phases
    for (let i = 0; i < total_phases; i++) {
        let random_tile = positions[Math.floor(Math.random() * positions.length)];
        good_positions.push(random_tile); // Push a random tile for each phase
    }

    let div = document.createElement('div');
    div.classList.add('group');
    div.style.width = mode_data[mode][1];
    div.style.height = mode_data[mode][1];
    const groups = document.querySelector('.groups');
    groups.innerHTML = ''; // Clear previous groups

    for (let i = 0; i < positions.length; i++) {
        let group = div.cloneNode();
        group.dataset.position = i.toString();
        groups.appendChild(group);
    }

    addListeners();

    document.querySelector('.streak').innerHTML = streak;
    document.querySelector('.max_streak').innerHTML = max_streak;
    document.querySelector('.best_time').innerHTML = best_time;

    // Hide splash screen when intro BGM ends
    introBgm.addEventListener('ended', () => {
        document.querySelector('.splash').classList.add('hidden');
        document.querySelector('.groups').classList.remove('hidden');
        document.querySelector('.timer-bar-container').classList.remove('hidden');

        showPhaseSequence();
    });

    // Play intro BGM when splash screen is shown
    introBgm.play();
}


function startTimer() {
    timerStart = new Date();
    timer_time = setInterval(timer, 1);
}

function timer() {
    let timerNow = new Date();
    let timerDiff = new Date(timerNow - timerStart);
    let ms = timerDiff.getMilliseconds();
    let sec = timerDiff.getSeconds();
    ms = ms < 10 ? "00" + ms : ms < 100 ? "0" + ms : ms;
    document.querySelector('.streaks .time').innerHTML = sec + "." + ms;
}

function stopTimer() {
    clearInterval(timer_time); // Stop the main timer
    clearTimeout(timer_phase); // Stop the phase timer
    phaseTimerActive = false; // Deactivate phase timer
}

function resetTimer() {
    clearInterval(timer_time); // Clear the main timer interval
    clearTimeout(timer_phase); // Clear the phase timer
    document.querySelector('.streaks .time').innerHTML = '0.000'; // Reset the time display
}

function initializeTimerBar() {
    timerFill = document.querySelector('.timer-fill');
}

let phaseTimerActive = false; // Track if phase timer is active

function updateTimerBar(phaseDuration) {
    if (!timerFill) return; // Ensure timerFill exists

    const startTime = performance.now(); // Use performance.now() for better timing accuracy
    const endTime = startTime + phaseDuration; // Calculate end time based on phase duration

    phaseTimerActive = true; // Set phase timer as active

    function update() {
        if (!phaseTimerActive) return; // Stop updating if phase timer is inactive
        
        const now = performance.now(); // Get current time
        const remainingTime = endTime - now; // Calculate remaining time

        // Calculate the percentage width based on remaining time
        const percentage = Math.max((remainingTime / phaseDuration) * 100, 0);
        timerFill.style.width = `${percentage}%`;

        // Continue updating until the end time is reached
        if (remainingTime > 0) {
            requestAnimationFrame(update);
        } else {
            timerFill.style.width = '0%'; // Ensure it ends at 0%
            phaseTimerActive = false; // Deactivate phase timer
        }
    }

    // Start the update loop
    update();
}

// Phase timer
function startPhaseTimer() {
    clearTimeout(timer_phase); // Ensure no overlapping phase timers
    // Calculate phase duration based on speed
    let phaseDuration = 3000 + (current_phase * 2000); // Duration for the phase
    updateTimerBar(phaseDuration); // Start updating the timer bar

    timer_phase = setTimeout(() => {
        if (game_started) {
            triggerError(); // Trigger an error if the phase times out
        }
    }, phaseDuration); // The time limit for each phase
}

// Resets
function reset() {
    stopTimer(); // Ensure all timers are stopped
    resetTimer(); // Ensure all timers are reset
    document.querySelector('.groups').innerHTML = ''; // Clear previous groups
    document.querySelector('.splash').classList.remove('hidden'); // Show the splash screen
    document.querySelector('.groups').classList.add('hidden'); // Hide the game groups
    document.querySelector('.timer-bar-container').classList.add('hidden'); // Hide the timer bar container
}

function resetToIntro() {
    // Perform general reset
    reset(); 

    // Ensure intro BGM is played again
    introBgm.currentTime = 0; // Restart BGM if already playing
    introBgm.play();

    // Reinitialize the timer bar
    initializeTimerBar();
    
    // Start the game again
    start();
}

initializeTimerBar();
start();