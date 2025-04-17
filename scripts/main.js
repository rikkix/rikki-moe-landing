// --- Constants ---
const app = document.querySelector("#app");
function delay(ms) {
  scrollToBottom();
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Data Definitions ---
const links = [
  { name: "blog", url: "https://blog.rikki.moe", desc: "Who am i and what do i do." },
  { name: "git", url: "https://git.rikki.moe", desc: "My personal git server." },
  { name: "github", url: "https://github.com/rikkix", desc: "My github page with my projects. Follow me there ;)" },
  { name: "matrix-chat", url: "https://chat.mtf.moe", desc: "My personal matrix chat server." }
];

const commands = [
  ...links,
  { name: "email", desc: "Get my email address." },
  { name: "help", desc: "Show the list of commands." },
  { name: "clear", desc: "Clear the terminal." }
];

const sudoRoasts = [
  "You think you're the boss now? Nice try, you're still guest.",
  "Trying to act like root? You can't fool me!",
  "Permission denied, root access is for the cool kids only.",
  "You're not fooling anyone, buddy. You're still a guest.",
  "Is that a root password, or just wishful thinking?",
  "The root can't hear you from down there, guest.",
  "I see you're trying to hack your way into being the boss... nice try!",
  "Rooting for root? Sorry, but you're still stuck as a guest."
];

const shutdownRoasts = [
  "Shutting down? Is your internet even working?",
  "You want to shut down? The system is already shutting down your self-esteem.",
  "Oh, you want to shut me down? Good luck with that.",
  "I’m not shutting down, you’re just pressing random keys.",
  "Trying to shutdown, but all you’ve achieved is pressing your own buttons.",
  "Shut down? Oh, you mean like your attempts at this command?",
  "Shutdown initiated... just kidding, it's still not happening."
];

const rebootRoasts = [
  "Rebooting? You're just hitting keys for fun, aren't you?",
  "You want to reboot, but your life is already stuck in an endless loop.",
  "Rebooting... Yeah, sure, just like that’ll fix everything.",
  "Your system is rebooting... but not your sense of reality.",
  "Trying to reboot? Maybe reboot your confidence instead.",
  "Rebooting is a nice thought, but I’m still not impressed.",
  "Let me guess, you’re trying to reboot me. Not gonna work!"
];

// --- Event Listeners ---
app.addEventListener("keypress", async function (event) {
  if (event.key === "Enter") {
    await delay(150);
    await executeInput();
  }
});

app.addEventListener("click", function () {
  const input = document.querySelector(".command-input");
  input.focus();
});

// --- Terminal Initialization ---
async function open_terminal() {
  createText("Welcome to Rikki's terminal");
  await delay(700);
  createText("Type 'help' to see the list of commands.");
  await delay(500);
  new_line();
  executeInput("help");
}

// --- Utility Functions ---
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function playSound(file) {
  const audio = new Audio(file);
  audio.play();
}

function scrollToBottom() {
  const scrollHeight = app.scrollHeight;
  app.scrollTop = scrollHeight;
}

function new_line() {
  const p = document.createElement("p");
  const span1 = document.createElement("span");
  p.setAttribute("class", "path");
  p.textContent = "guest@rikki";
  span1.textContent = " ~";
  p.appendChild(span1);
  app.appendChild(p);

  const div = document.createElement("div");
  div.setAttribute("class", "type");
  const i = document.createElement("i");
  i.setAttribute("class", "fas fa-angle-right icone");

  // Create a hidden input field to prevent autocomplete
  const hiddenInput = document.createElement("input");
  hiddenInput.setAttribute("style", "display: none; visibility: hidden;");

  const input = document.createElement("input");
  input.setAttribute("class", "command-input");


  div.appendChild(i);
  div.appendChild(hiddenInput);
  div.appendChild(input);
  app.appendChild(div);
  input.focus();
}

function removeInput() {
  const div = document.querySelector(".type");
  app.removeChild(div);
}

// --- Command Handlers ---
async function executeInput(command) {
  var value = command ? command : document.querySelector(".command-input").value;
  removeInput();

  value = value.trim();
  const args = value.split(" ");
  const commandName = args[0];

  await showOutput(commandName, args);
  new_line();
}

async function showOutput(command, args) {
  switch (command) {
    case "help":
      trueValue(command);
      help();
      break;
    case "clear":
      clearTerminal();
      break;
    case "su":
    case "sudo":
      trueValue(command);
      createText("Upgrading to root...");
      await delay(400);
      createText(randomElement(sudoRoasts));
      break;
    case "shutdown":
      trueValue(command);
      createText("Shutting down...");
      await delay(400);
      createText(randomElement(shutdownRoasts));
      break;
    case "reboot":
      trueValue(command);
      createText("Rebooting...");
      await delay(400);
      createText(randomElement(rebootRoasts));
      break;
    case "echo":
      const textToEcho = args.slice(1).join(" ");
      trueValue(command);
      createText(`Echo: ${textToEcho}`);
      break;
    case "df":
      trueValue(command);
      createText("Filesystem           1K-blocks      Used Available Use% Mounted on");
      createText("/dev/sda1              10240000   5120000   5120000  50% /");
      createText("/dev/sdb1              20480000   20400000     800000 100% /mnt/usb");
      createText("Disk space low? Not in my world.");
      break;
    case "pwd":
      trueValue(command);
      createText("/home/guest/No_Way_Out");
      break;
    case "cat":
      const fileName = args[1] || 'undefined.txt';
      trueValue(command);
      if (fileName === 'undefined.txt') {
        createText("cat: undefined.txt: No such file or directory");
      } else {
        createText(`Reading contents of ${fileName}...`);
        await delay(500);
        createText("Error: This file is too mysterious to read.");
      }
      break;
    case "top":
      trueValue(command);
      createText("Processes running...\n");
      await delay(500);
      createText("PID    USER   %CPU  %MEM   COMMAND");
      createText("1234   root   0.2   1.0   /bin/bash");
      createText("5678   guest  0.5   0.7   /usr/bin/firefox");
      createText("9876   guest  99.9  99.9   /usr/bin/playing_hokey_pokey.sh");
      createText("Process hogging all your memory: You.");
      break;
    case "rm":
      const fileToRemove = args[1] || "important_file.txt";
      trueValue(command);
      if (fileToRemove === "important_file.txt") {
        createText(`Are you sure you want to delete '${fileToRemove}'? [y/N]`);
        await delay(500);
        createText("Error: You can't delete this file. It's too important!");
      } else {
        createText(`Deleted '${fileToRemove}'... (Just kidding, it's still there.)`);
      }
      break;
    case "ls":
      trueValue(command);
      const files = [
        "Desktop",
        "Documents",
        "Downloads",
        "src/",
        "memes/",
        "very_secret_file.txt",
        "super_important_task_list.docx",
        "you_dont_want_to_know.mp3",
        "this_is_a_test_file.txt"
      ];
      files.forEach(file => createText(file));
      break;
    case "oiia":
      trueValue(command);
      playSound('/static/oiia-short.mp3'); // Assume you have a sound file for cheering
      createText("Oiia! Oiia! Oiia!");
      await delay(1000);
      createText("Oiia! Oiia! Oiia!");
      await delay(1000);
      break;
    case "email":
      trueValue(command);
      createText("Getting email address...");
      // record the time taken to get the email address
      const startTime = performance.now();
      const email = await getEmailAddress();
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      createText(`The email address is: <a href="mailto:${email}" target="_blank">${email}</a> (${timeTaken.toFixed(2)}ms)`);
      break;
    default:
      handleLinkCommands(command);
      break;
  }
}

function help() {
  commands.forEach(command => printCommand(command.name, command.desc));
}

function clearTerminal() {
  document.querySelectorAll("p, section").forEach(e => e.parentNode.removeChild(e));
}

async function handleLinkCommands(command) {
  for (let link of links) {
    if (command === link.name) {
      trueValue(command);
      createText(`Opening ${link.name} (<a href="${link.url}" target="_blank">${link.url}</a>)`);
      scrollToBottom();
      await delay(400);
      window.open(link.url, "_blank");
      return;
    }
  }
  falseValue(command);
  createErrorText(`command not found: ${command}`);
}

// --- Command Output Helpers ---
function trueValue(value) {
  const div = document.createElement("section");
  div.setAttribute("class", "type2");
  const i = document.createElement("i");
  i.setAttribute("class", "fas fa-angle-right icone");
  const mensagem = document.createElement("h2");
  mensagem.setAttribute("class", "sucess");
  mensagem.textContent = `${value}`;
  div.appendChild(i);
  div.appendChild(mensagem);
  app.appendChild(div);
}

function falseValue(value) {
  const div = document.createElement("section");
  div.setAttribute("class", "type2");
  const i = document.createElement("i");
  i.setAttribute("class", "fas fa-angle-right icone error");
  const mensagem = document.createElement("h2");
  mensagem.setAttribute("class", "error");
  mensagem.textContent = `${value}`;
  div.appendChild(i);
  div.appendChild(mensagem);
  app.appendChild(div);
}

function createText(text) {
  const p = document.createElement("p");
  p.innerHTML = text;
  app.appendChild(p);
}

function printCommand(command, desc) {
  const p = document.createElement("p");
  p.setAttribute("class", "code");
  const cmdEle = document.createElement("a");
  cmdEle.setAttribute("class", "command");
  cmdEle.innerText = command;

  cmdEle.addEventListener("click", async function () {
    await delay(150);
    await executeInput(command);
  });

  cmdEle.style.cursor = "pointer";
  const descEle = document.createElement("span");
  descEle.setAttribute("class", "text");
  descEle.innerText = desc;

  p.appendChild(cmdEle);
  p.appendChild(document.createElement("br"));
  p.appendChild(descEle);

  app.appendChild(p);
}

function createErrorText(text) {
  const p = document.createElement("p");
  p.innerText = text;
  app.appendChild(p);
}

// --- Email Fetching ---
async function getEmailAddress() {
  const partHash = "2f5ab71af6dfd2f3c5444a2d690fbbb880ee87f9";
  const remainingPart = "rikki.moe";
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()';

  for (let i = 0; i < chars.length; i++) {
    for (let j = 0; j < chars.length; j++) {
      const part = chars[i] + chars[j];
      const hash = await String2Hash(part);
      if (hash === partHash) {
        return part + remainingPart;
      }
    }
  }

  return null;
}

async function String2Hash(username) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Terminal Start ---
open_terminal();