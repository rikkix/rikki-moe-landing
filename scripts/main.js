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
  { name: 'oiia', desc: 'Summon the oiia cat.' },
  { name: 'help', desc: 'Show the list of commands.' },
  { name: 'clear', desc: 'Clear the terminal.' },
];

// Hidden from help but still functional and autocompleted
const HIDDEN_COMMANDS = ['su', 'sudo', 'shutdown', 'reboot', 'echo', 'df', 'top', 'rm',
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'write', 'reset-fs'];

const ALL_COMMAND_NAMES = [
  ...COMMANDS.map(cmd => cmd.name),
  ...HIDDEN_COMMANDS
].sort();

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
};

// --------- Virtual Filesystem ---------
const INITIAL_FS = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        guest: {
          type: 'dir',
          children: {
            'readme.txt': {
              type: 'file',
              content: 'Welcome to rikki.moe!\n\nThis is a terminal-style landing page.\nType "help" to see available commands.'
            },
            links: {
              type: 'dir',
              children: {
                'blog.txt': { type: 'file', content: 'Blog: https://blog.rikki.moe\nWho am I and what do I do.' },
                'github.txt': { type: 'file', content: 'GitHub: https://github.com/rikkix\nMy projects. Follow me there ;)' },
                'git.txt': { type: 'file', content: 'Git: https://git.rikki.moe\nMy personal git server.' },
                'matrix.txt': { type: 'file', content: 'Matrix: https://chat.mtf.moe\nMy personal matrix chat server.' }
              }
            }
          }
        }
      }
    }
  }
};

let fs = structuredClone(INITIAL_FS);
let cwdParts = ['home', 'guest']; // path segments relative to fs root

// --------- FS Utilities ---------
function saveState() {
  try {
    sessionStorage.setItem('rikki-fs', JSON.stringify(fs));
    sessionStorage.setItem('rikki-cwd', JSON.stringify(cwdParts));
  } catch (_) {}
}

function loadState() {
  try {
    const savedFs = sessionStorage.getItem('rikki-fs');
    const savedCwd = sessionStorage.getItem('rikki-cwd');
    if (savedFs) fs = JSON.parse(savedFs);
    if (savedCwd) cwdParts = JSON.parse(savedCwd);
  } catch (_) {}
}

function resolvePath(base, pathStr) {
  const isAbsolute = pathStr.startsWith('/');
  const result = isAbsolute ? [] : [...base];
  for (const seg of pathStr.split('/').filter(Boolean)) {
    if (seg === '..') { if (result.length > 0) result.pop(); }
    else if (seg !== '.') result.push(seg);
  }
  return result;
}

function getNodeAt(parts) {
  let node = fs;
  for (const part of parts) {
    if (node.type !== 'dir' || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

function cwdDisplay() {
  const full = '/' + cwdParts.join('/');
  if (full === '/home/guest') return '~';
  if (full.startsWith('/home/guest/')) return '~' + full.slice('/home/guest'.length);
  return full || '/';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --------- FS Command Implementations ---------
function cmdLs(args) {
  const targetParts = args[0] ? resolvePath(cwdParts, args[0]) : cwdParts;
  const node = getNodeAt(targetParts);
  if (!node) {
    createErrorText(`ls: ${args[0]}: No such file or directory`);
    return;
  }
  if (node.type === 'file') {
    createText(escapeHtml(args[0]));
    return;
  }
  const entries = Object.entries(node.children);
  if (entries.length === 0) {
    createText('(empty directory)');
    return;
  }
  const formatted = entries.map(([name, n]) =>
    n.type === 'dir'
      ? `<span style="color:#9CEAF3">${escapeHtml(name)}/</span>`
      : escapeHtml(name)
  ).join('&nbsp;&nbsp;&nbsp;');
  createText(formatted);
}

function cmdCd(args) {
  const pathStr = args[0] ?? '/home/guest';
  const targetParts = resolvePath(cwdParts, pathStr);
  const node = getNodeAt(targetParts);
  if (!node) {
    createErrorText(`cd: ${pathStr}: No such file or directory`);
    return;
  }
  if (node.type !== 'dir') {
    createErrorText(`cd: ${pathStr}: Not a directory`);
    return;
  }
  cwdParts = targetParts;
  saveState();
}

function cmdPwd() {
  createText('/' + cwdParts.join('/'));
}

function resolveParent(pathStr) {
  const segments = pathStr.replace(/\/$/, '').split('/').filter(Boolean);
  const entryName = segments.pop();
  const parentParts = segments.length ? resolvePath(cwdParts, segments.join('/')) : cwdParts;
  return { parent: getNodeAt(parentParts), entryName };
}

function cmdMkdir(args) {
  const name = args[0];
  if (!name) { createErrorText('mkdir: missing operand'); return; }
  const { parent, entryName } = resolveParent(name);
  if (!parent || parent.type !== 'dir') {
    createErrorText(`mkdir: cannot create directory '${escapeHtml(name)}': No such file or directory`);
    return;
  }
  if (parent.children[entryName]) {
    createErrorText(`mkdir: cannot create directory '${escapeHtml(name)}': File exists`);
    return;
  }
  parent.children[entryName] = { type: 'dir', children: {} };
  saveState();
}

function cmdTouch(args) {
  const name = args[0];
  if (!name) { createErrorText('touch: missing file operand'); return; }
  const { parent, entryName } = resolveParent(name);
  if (!parent || parent.type !== 'dir') {
    createErrorText(`touch: ${escapeHtml(name)}: No such file or directory`);
    return;
  }
  if (!parent.children[entryName]) {
    parent.children[entryName] = { type: 'file', content: '' };
    saveState();
  }
}

function cmdCat(args) {
  const name = args[0];
  if (!name) { createErrorText('cat: missing file operand'); return; }
  const node = getNodeAt(resolvePath(cwdParts, name));
  if (!node) { createErrorText(`cat: ${escapeHtml(name)}: No such file or directory`); return; }
  if (node.type !== 'file') { createErrorText(`cat: ${escapeHtml(name)}: Is a directory`); return; }
  createText(escapeHtml(node.content).replace(/\n/g, '<br>'));
}

function cmdWrite(args) {
  const name = args[0];
  if (!name) { createErrorText('write: missing file operand'); return; }
  const { parent, entryName } = resolveParent(name);
  if (!parent || parent.type !== 'dir') {
    createErrorText(`write: ${escapeHtml(name)}: No such file or directory`);
    return;
  }
  const content = args.slice(1).join(' ');
  parent.children[entryName] = { type: 'file', content };
  saveState();
  createText(`Written to '${escapeHtml(name)}'.`);
}

function cmdRm(args) {
  const target = args[0];
  if (!target) {
    createErrorText('rm: missing operand');
    return;
  }
  const { parent, entryName } = resolveParent(target);
  if (parent && parent.type === 'dir' && parent.children[entryName]) {
    delete parent.children[entryName];
    saveState();
    createText(`Removed '${escapeHtml(target)}'.`);
  } else {
    createErrorText(`rm: ${escapeHtml(target)}: No such file or directory`);
  }
}

// --------- Utilities ---------
const delay = ms => {
  scrollToBottom();
  return new Promise(resolve => setTimeout(resolve, ms));
};

const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];

// --------- Audio Playback ---------
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

const AudioCtx = window.AudioContext ?? /** @type {typeof AudioContext} */ (/** @type {any} */ (window).webkitAudioContext);
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

async function playSound(file, speed = 1, loops = 1) {
  if (loops <= 0) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') await ctx.resume();
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
    if (loops > 1) src.stop(ctx.currentTime + (buffer.duration / speed) * loops);
    return new Promise(resolve => { src.onended = resolve; });
  } catch (err) {
    console.error('Failed to play sound:', err);
    return Promise.reject(err);
  }
}

// --------- DOM Helpers ---------
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

function makePromptSpans(dir) {
  const user   = document.createElement('span');
  user.className   = 'prompt-user';
  user.textContent = 'guest@rikki';

  const path   = document.createElement('span');
  path.className   = 'prompt-path';
  path.textContent = ' ' + dir;

  const dollar = document.createElement('span');
  dollar.className   = 'prompt-dollar';
  dollar.textContent = ' $';

  return [user, path, dollar];
}

function createPrompt() {
  const dir = cwdDisplay();
  document.title = `guest@rikki.moe: ${dir}`;

  const div = document.createElement('div');
  div.className = 'prompt-active';

  const input = document.createElement('input');
  input.className = 'command-input';
  input.autocomplete = 'off';
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('spellcheck', 'false');
  input.readOnly = true;
  input.addEventListener('focus', () => { input.readOnly = false; }, { once: true });

  div.append(...makePromptSpans(dir), input);
  app.appendChild(div);
  input.focus();
}

function removePrompt() {
  const div = document.querySelector('.prompt-active');
  if (div) app.removeChild(div);
}

function createText(html) {
  const p = document.createElement('p');
  p.innerHTML = html;
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

// --------- Output Helpers ---------
const createOutput = (val, success = true) => {
  const div = document.createElement('div');
  div.className = 'prompt-echo';

  const cmd = document.createElement('span');
  cmd.className = success ? 'prompt-cmd' : 'prompt-cmd error';
  cmd.textContent = val;

  div.append(...makePromptSpans(cwdDisplay()), cmd);
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

// --------- Command Map ---------
const COMMAND_MAP = {
  help: async () => {
    COMMANDS.forEach(cmd => printCommand(cmd.name, cmd.desc));
  },

  clear: async () => {
    clearTerminal();
  },

  ls: async (args) => {
    cmdLs(args);
  },

  cd: async (args) => {
    cmdCd(args);
  },

  pwd: async () => {
    cmdPwd();
  },

  mkdir: async (args) => {
    cmdMkdir(args);
  },

  touch: async (args) => {
    cmdTouch(args);
  },

  cat: async (args) => {
    cmdCat(args);
  },

  write: async (args) => {
    cmdWrite(args);
  },

  'reset-fs': async () => {
    fs = structuredClone(INITIAL_FS);
    cwdParts = ['home', 'guest'];
    saveState();
    createText('Filesystem restored to defaults.');
  },

  rm: async (args) => {
    cmdRm(args);
  },

  echo: async (args) => {
    createText(escapeHtml(args.join(' ')));
  },

  email: async () => {
    createText('Getting email address...');
    const start = performance.now();
    const email = await getEmailAddress();
    const duration = performance.now() - start;
    createText(`The email address is: <a href="mailto:${email}" target="_blank">${email}</a> (${duration.toFixed(2)}ms)`);
  },

  oiia: async () => {
    createText('Oiia is coming...');
    const iv = setInterval(() => createText('Oiia! Oiia! Oiia!'), 700);
    try {
      await playSound('/static/oiia-short.mp3', Math.random() + 0.5, 2);
    } catch (err) {
      createErrorText('Failed to play sound: ' + err.message);
    }
    clearInterval(iv);
  },

  su: async () => {
    createText('Upgrading to root...');
    await delay(400);
    createText(randomElement(ROASTS.sudo));
  },

  sudo: async () => {
    createText('Upgrading to root...');
    await delay(400);
    createText(randomElement(ROASTS.sudo));
  },

  shutdown: async () => {
    createText('Shutting down...');
    await delay(1000);
    window.close();
    await delay(500);
    createText("Your browser won't let me close this tab. Close it yourself.");
  },

  reboot: async () => {
    createText('Rebooting...');
    await delay(1000);
    clearTerminal();
    await bootSequence();
  },

  df: async () => {
    ['Filesystem           1K-blocks      Used Available Use% Mounted on',
      '/dev/sda1              10240000   5120000   5120000  50% /',
      '/dev/sdb1              20480000   20400000     800000 100% /mnt/usb',
      'Disk space low? Not in my world.'].forEach(createText);
  },

  top: async () => {
    createText('Processes running...');
    await delay(500);
    ['PID    USER   %CPU  %MEM   COMMAND',
      '1234   root   0.2   1.0   /bin/bash',
      '5678   guest  0.5   0.7   /usr/bin/firefox',
      '9876   guest  99.9  99.9   /usr/bin/playing_hokey_pokey.sh',
      'Process hogging all your memory: You.'].forEach(createText);
  },
};

// --------- Command Execution ---------
async function executeInput(provided) {
  clearSuggestions();
  const raw = provided ?? document.querySelector('.command-input').value;
  removePrompt();
  const value = raw.trim();
  if (!value) {
    createPrompt();
    return;
  }
  if (commandHistory[commandHistory.length - 1] !== value) commandHistory.push(value);
  historyIndex = -1;
  historySavedInput = '';
  const [command, ...args] = value.split(' ');
  await showOutput(command, args);
  if (!document.querySelector('.prompt-active')) createPrompt();
}

async function showOutput(command, args) {
  const fullCmd = args.length ? `${command} ${args.join(' ')}` : command;
  const handler = COMMAND_MAP[command];
  if (handler) {
    createOutput(fullCmd, true);
    await handler(args);
    return;
  }
  const link = LINKS.find(l => l.name === command);
  if (link) {
    createOutput(fullCmd, true);
    createText(`Opening ${command} (<a href="${link.url}" target="_blank">${link.url}</a>)`);
    await delay(400);
    window.open(link.url, '_blank');
    return;
  }
  createOutput(fullCmd, false);
  createErrorText(`command not found: ${command}`);
}

function clearTerminal() {
  document.querySelectorAll('p, .prompt-echo, .prompt-active').forEach(e => e.remove());
}

// --------- Initialization ---------
let tabState = null; // { cmdPart, matches, index } when cycling
let commandHistory = [];
let historyIndex = -1;
let historySavedInput = '';

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
    document.querySelector('.command-input')?.focus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const input = document.querySelector('.command-input');
      if (!input) return;

      // If already cycling, advance to next match
      if (tabState) {
        tabState.index = (tabState.index + 1) % tabState.matches.length;
        input.value = tabState.cmdPart + tabState.matches[tabState.index];
        return;
      }

      // First Tab press — compute matches
      clearSuggestions();
      const value = input.value;
      const spaceIdx = value.indexOf(' ');

      let cmdPart, matches;
      if (spaceIdx === -1) {
        cmdPart = '';
        matches = ALL_COMMAND_NAMES.filter(cmd => cmd.startsWith(value));
      } else {
        cmdPart = value.slice(0, spaceIdx + 1);
        const partial = value.slice(spaceIdx + 1);
        const lastSlash = partial.lastIndexOf('/');
        const dirPath = lastSlash === -1 ? null : partial.slice(0, lastSlash);
        const namePartial = partial.slice(lastSlash + 1);
        const prefix = lastSlash === -1 ? '' : partial.slice(0, lastSlash + 1);
        const searchDir = dirPath === null ? cwdParts : resolvePath(cwdParts, dirPath);
        const node = getNodeAt(searchDir);
        matches = (node?.type === 'dir')
          ? Object.keys(node.children)
              .filter(n => n.startsWith(namePartial))
              .map(n => prefix + n)
          : [];
      }

      if (matches.length === 1) {
        let suffix = spaceIdx === -1 ? ' ' : '';
        if (spaceIdx !== -1) {
          const matchNode = getNodeAt(resolvePath(cwdParts, matches[0]));
          if (matchNode?.type === 'dir') suffix = '/';
        }
        input.value = cmdPart + matches[0] + suffix;
      } else if (matches.length > 1) {
        createSuggestion(matches.join('    '));
        input.value = cmdPart + matches[0];
        tabState = { cmdPart, matches, index: 0 };
      }
    } else if (e.key === 'ArrowUp') {
      const input = document.querySelector('.command-input');
      if (!input || commandHistory.length === 0) return;
      e.preventDefault();
      if (historyIndex === -1) historySavedInput = input.value;
      historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      input.value = commandHistory[commandHistory.length - 1 - historyIndex];
    } else if (e.key === 'ArrowDown') {
      const input = document.querySelector('.command-input');
      if (!input || historyIndex === -1) return;
      e.preventDefault();
      historyIndex--;
      input.value = historyIndex === -1 ? historySavedInput : commandHistory[commandHistory.length - 1 - historyIndex];
    } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
      // Any regular key resets the tab cycle
      tabState = null;
    }
  });
}

async function bootSequence() {
  createText("Welcome to Rikki's terminal");
  await delay(700);
  createText("Type 'help' to see the list of commands.");
  await delay(500);
  createPrompt();
  await executeInput('help');
}

async function openTerminal() {
  loadState();
  await bootSequence();
}

// Start
setupEventListeners();
openTerminal();
