// --------- Constants ---------
const app = document.querySelector('#app');

const LINKS = [
  { name: 'blog', url: 'https://blog.rikki.moe', desc: 'Who am i and what do i do.' },
  { name: 'git', url: 'https://git.rikki.moe', desc: 'My personal git server.' },
  { name: 'github', url: 'https://github.com/rikkix', desc: 'My github page with my projects. Follow me there ;)' },
  { name: 'matrix-chat', url: 'https://chat.mtf.moe', desc: 'My personal matrix chat server.' }
];

const COMMANDS = [
  ...LINKS,
  { name: 'email', desc: 'Get my email address.' },
  { name: 'help', desc: 'Show the list of commands.' },
  { name: 'clear', desc: 'Clear the terminal.' }
];

// Built-in handlers not in COMMANDS
const BUILTIN_COMMANDS = ['su', 'sudo', 'shutdown', 'reboot', 'echo', 'df', 'pwd', 'cat', 'top', 'rm', 'ls', 'oiia'];

// Consolidated for autocomplete
const ALL_COMMANDS = [
  ...COMMANDS.map(cmd => cmd.name),
  ...BUILTIN_COMMANDS
];

const ROASTS = {
  sudo: [
    "You think you're the boss now? Nice try, you're still guest.",
    "Trying to act like root? You can't fool me!",
    "Permission denied, root access is for the cool kids only.",
    "You're not fooling anyone, buddy. You're still a guest.",
    "Is that a root password, or just wishful thinking?",
    "The root can't hear you from down there, guest.",
    "I see you're trying to hack your way into being the boss... nice try!",
    "Rooting for root? Sorry, but you're still stuck as a guest."
  ],
  shutdown: [
    "Shutting down? Is your internet even working?",
    "You want to shut down? The system is already shutting down your self-esteem.",
    "Oh, you want to shut me down? Good luck with that.",
    "I’m not shutting down, you’re just pressing random keys.",
    "Trying to shutdown, but all you’ve achieved is pressing your own buttons.",
    "Shut down? Oh, you mean like your attempts at this command?",
    "Shutdown initiated... just kidding, it's still not happening."
  ],
  reboot: [
    "Rebooting? You're just hitting keys for fun, aren't you?",
    "You want to reboot, but your life is already stuck in an endless loop.",
    "Rebooting... Yeah, sure, just like that’ll fix everything.",
    "Your system is rebooting... but not your sense of reality.",
    "Trying to reboot? Maybe reboot your confidence instead.",
    "Rebooting is a nice thought, but I’m still not impressed.",
    "Let me guess, you’re trying to reboot me. Not gonna work!"
  ]
};

// --------- Utilities ---------
const delay = ms => {
  scrollToBottom();
  return new Promise(resolve => setTimeout(resolve, ms));
};

const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];

// --------- Audio Playback ---------
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
}

const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

async function playSound(file, speed = 1, loops = 1) {
  if (loops <= 0) return;

  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    const resp = await fetch(file, { mode: 'cors' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.arrayBuffer();

    const buffer = await ctx.decodeAudioData(data);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = speed;
    src.loop = loops > 1;

    src.connect(ctx.destination);
    src.start();

    if (loops > 1) {
      const totalTime = (buffer.duration / speed) * loops;
      src.stop(ctx.currentTime + totalTime);
    }

    return new Promise((resolve, reject) => {
      src.onended = () => {
        resolve();
      };
    });
  } catch (err) {
    // console.warn('⚠️ WebAudio path failed, falling back to HTMLAudioElement:', err);
    // return _playWithAudioElement(file, speed, loops);

    console.error('❌ Failed to play sound:', err);
    return Promise.reject(err);
  }
}

// function _playWithAudioElement(file, speed, loops) {
//   if (loops <= 0) return Promise.resolve();

//   const audio = new Audio(file);
//   audio.preload = 'auto';
//   audio.crossOrigin = 'anonymous';
//   audio.playbackRate = speed;

//   let remaining = loops;

//   audio.addEventListener('ended',    onEnded);
//   audio.addEventListener('error',     onError);

//   function onEnded() {
//     remaining--;
//     if (remaining > 0) {
//       audio.currentTime = 0;
//       audio.play().catch(onError);
//     } else {
//       cleanup();
//       resolvePromise();
//     }
//   }

//   function onError(e) {
//     cleanup();
//     rejectPromise(e);
//   }

//   function cleanup() {
//     audio.pause();
//     audio.currentTime = 0;
//     audio.removeEventListener('ended', onEnded);
//     audio.removeEventListener('error', onError);
//   }

//   let resolvePromise, rejectPromise;
//   const p = new Promise((res, rej) => {
//     resolvePromise = res;
//     rejectPromise  = rej;
//   });

//   // kick it off
//   audio.play()
//     .catch(err => {
//       console.error('❌ <audio>.play() rejected:', err);
//       onError(err);
//     });

//   return p;
// }

// --------- DOM & Autocomplete Helpers ---------
function scrollToBottom() {
  app.scrollTop = app.scrollHeight;
}

function clearSuggestions() {
  document.querySelectorAll('.autocomplete-suggestion').forEach(el => el.remove());
}

function createSuggestion(text) {
  const p = document.createElement('p');
  p.className = 'autocomplete-suggestion';
  p.innerText = text;
  app.appendChild(p);
  scrollToBottom();
}

function createPrompt() {
  const p = document.createElement('p');
  p.className = 'path';
  p.textContent = 'guest@rikki';
  const span = document.createElement('span');
  span.textContent = ' ~';
  p.appendChild(span);
  app.appendChild(p);

  const div = document.createElement('div');
  div.className = 'type';
  const icon = document.createElement('i');
  icon.className = 'fas fa-angle-right icone';

  const hidden = document.createElement('input');
  hidden.style = 'display:none; visibility:hidden;';

  const input = document.createElement('input');
  input.className = 'command-input';

  div.append(icon, hidden, input);
  app.appendChild(div);
  input.focus();
}

function removePrompt() {
  const div = document.querySelector('.type');
  if (div) app.removeChild(div);
}

function createText(text) {
  const p = document.createElement('p');
  p.innerHTML = text;
  app.appendChild(p);
  scrollToBottom();
}

function createErrorText(text) {
  const p = document.createElement('p');
  p.textContent = text;
  app.appendChild(p);
  scrollToBottom();
}

function printCommand(name, desc) {
  const p = document.createElement('p');
  p.className = 'code';

  const cmd = document.createElement('a');
  cmd.className = 'command';
  cmd.textContent = name;
  cmd.style.cursor = 'pointer';
  cmd.addEventListener('click', async () => {
    clearSuggestions();
    await delay(150);
    await executeInput(name);
  });

  const span = document.createElement('span');
  span.className = 'text';
  span.textContent = desc;

  p.append(cmd, document.createElement('br'), span);
  app.appendChild(p);
  scrollToBottom();
}

// --------- Command Handlers ---------
async function executeInput(provided) {
  clearSuggestions();
  const raw = provided ?? document.querySelector('.command-input').value;
  removePrompt();
  const value = raw.trim();
  const [command, ...args] = value.split(' ');
  await showOutput(command, args);
  createPrompt();
}

async function showOutput(command, args) {
  switch (command) {
    case 'help':
      trueValue(command);
      help();
      break;
    case 'clear':
      clearTerminal();
      break;
    case 'su':
    case 'sudo':
      trueValue(command);
      createText('Upgrading to root...');
      await delay(400);
      createText(randomElement(ROASTS.sudo));
      break;
    case 'shutdown':
      trueValue(command);
      createText('Shutting down...');
      await delay(400);
      createText(randomElement(ROASTS.shutdown));
      break;
    case 'reboot':
      trueValue(command);
      createText('Rebooting...');
      await delay(400);
      createText(randomElement(ROASTS.reboot));
      break;
    case 'echo':
      trueValue(command);
      createText(`Echo: ${args.join(' ')}`);
      break;
    case 'df':
      trueValue(command);
      ['Filesystem           1K-blocks      Used Available Use% Mounted on',
        '/dev/sda1              10240000   5120000   5120000  50% /',
        '/dev/sdb1              20480000   20400000     800000 100% /mnt/usb',
        'Disk space low? Not in my world.'].forEach(createText);
      break;
    case 'pwd':
      trueValue(command);
      createText('/home/guest/No_Way_Out');
      break;
    case 'cat': {
      const file = args[0] || 'undefined.txt';
      trueValue(command);
      if (file === 'undefined.txt') {
        createText(`cat: undefined.txt: No such file or directory`);
      } else {
        createText(`Reading contents of ${file}...`);
        await delay(500);
        createText('Error: This file is too mysterious to read.');
      }
      break;
    }
    case 'top':
      trueValue(command);
      createText('Processes running...');
      await delay(500);
      ['PID    USER   %CPU  %MEM   COMMAND',
        '1234   root   0.2   1.0   /bin/bash',
        '5678   guest  0.5   0.7   /usr/bin/firefox',
        '9876   guest  99.9  99.9   /usr/bin/playing_hokey_pokey.sh',
        'Process hogging all your memory: You.'].forEach(createText);
      break;
    case 'rm': {
      const target = args[0] || 'important_file.txt';
      trueValue(command);
      if (target === 'important_file.txt') {
        createText(`Are you sure you want to delete '${target}'? [y/N]`);
        await delay(500);
        createText("Error: You can't delete this file. It's too important!");
      } else {
        createText(`Deleted '${target}'... (Just kidding, it's still there.)`);
      }
      break;
    }
    case 'ls':
      trueValue(command);
      ['Desktop', 'Documents', 'Downloads', 'src/', 'memes/', 'very_secret_file.txt',
        'super_important_task_list.docx', 'you_dont_want_to_know.mp3', 'this_is_a_test_file.txt']
        .forEach(createText);
      break;
    case 'oiia':
      trueValue(command);
      createText('Oiia is coming...');
      const iv = setInterval(() => createText('Oiia! Oiia! Oiia!'), 700);
      // playSound and check if error
      try {
        await playSound('/static/oiia-short.mp3', Math.random() + 0.5, 2);
      } catch (err) {
        createErrorText('Failed to play sound: ' + err.message);
      }
        
      clearInterval(iv);
      break;
    case 'email':
      trueValue(command);
      createText('Getting email address...');
      const start = performance.now();
      const email = await getEmailAddress();
      const duration = performance.now() - start;
      createText(`The email address is: <a href=\"mailto:${email}\" target=\"_blank\">${email}</a> (${duration.toFixed(2)}ms)`);
      break;
    default:
      await handleLinkCommands(command);
      break;
  }
}

function help() {
  COMMANDS.forEach(cmd => printCommand(cmd.name, cmd.desc));
}

function clearTerminal() {
  document.querySelectorAll('p, section').forEach(e => e.remove());
}

async function handleLinkCommands(cmd) {
  const link = LINKS.find(l => l.name === cmd);
  if (link) {
    trueValue(cmd);
    createText(`Opening ${cmd} (<a href=\"${link.url}\" target=\"_blank\">${link.url}</a>)`);
    await delay(400);
    window.open(link.url, '_blank');
  } else {
    falseValue(cmd);
    createErrorText(`command not found: ${cmd}`);
  }
}

// --------- Output Helpers ---------
const createOutput = (val, success = true) => {
  const div = document.createElement('section');
  div.className = 'type2';
  const icon = document.createElement('i');
  icon.className = `fas fa-angle-right icone${success ? '' : ' error'}`;
  const msg = document.createElement('h2');
  msg.className = success ? 'sucess' : 'error';
  msg.textContent = val;
  div.append(icon, msg);
  app.appendChild(div);
  scrollToBottom();
};

function trueValue(val) { createOutput(val, true); }
function falseValue(val) { createOutput(val, false); }

// --------- Email Hashing ---------
async function getEmailAddress() {
  const partHash = '2f5ab71af6dfd2f3c5444a2d690fbbb880ee87f9';
  const domain = 'rikki.moe';
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()';

  for (const a of chars) {
    for (const b of chars) {
      const hash = await hashString(a + b);
      if (hash === partHash) return `${a}${b}${domain}`;
    }
  }
  return null;
}

async function hashString(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --------- Initialization ---------
function setupEventListeners() {
  app.addEventListener('keypress', async e => {
    unlockAudio();
    if (e.key === 'Enter') {
      clearSuggestions();
      await delay(150);
      await executeInput();
    }
  });

  app.addEventListener('click', () => {
    const input = document.querySelector('.command-input');
    input?.focus();
  });

  // Tab autocomplete
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const input = document.querySelector('.command-input');
      if (!input) return;
      clearSuggestions();
      const value = input.value;
      const matches = ALL_COMMANDS.filter(cmd => cmd.startsWith(value));
      if (matches.length === 1) {
        input.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        createSuggestion(matches.join('    '));
      }
    }
  });
}

async function openTerminal() {
  createText("Welcome to Rikki's terminal");
  await delay(700);
  createText("Type 'help' to see the list of commands.");
  await delay(500);
  createPrompt();
  executeInput('help');
}

// Start
setupEventListeners();
openTerminal();
