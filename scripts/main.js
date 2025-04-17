const app = document.querySelector("#app");
const delay = ms => new Promise(res => setTimeout(res, ms));

links = [
  {
    name: "blog",
    url: "https://blog.rikki.moe",
    desc: "Who am i and what do i do.",
  },
  {
    name: "git",
    url: "https://git.rikki.moe",
    desc: "My personal git server.",
  },
  {
    name: "github",
    url: "https://github.com/rikkix",
    desc: "My github page with my projects. Follow me there ;)",
  },
  {
    name: "matrix-chat",
    url: "https://chat.mtf.moe",
    desc: "My personal matrix chat server.",
  }
]

commands = [
  ...links,
  {
    name: "email",
    desc: "Get my email address.",
  },
  {
    name: "help",
    desc: "Show the list of commands.",
  },
  {
    name: "clear",
    desc: "Clear the terminal.",
  }
]

app.addEventListener("keypress", async function (event) {
  if (event.key === "Enter") {
    await delay(150);
    await executeInput();
  }
});

app.addEventListener("click", function (event) {
  const input = document.querySelector("input");
  input.focus();
})


async function open_terminal() {
  createText("Welcome to Rikki's terminal");
  await delay(700);
  createText("Type 'help' to see the list of commands.");
  await delay(500);

  new_line();

  executeInput("help")
}

function scrollToBottom() {
  const scrollHeight = app.scrollHeight;
  app.scrollTop = scrollHeight;
}


function new_line() {
  const p = document.createElement("p");
  const span1 = document.createElement("span");
  p.setAttribute("class", "path")
  p.textContent = "guest@rikki";
  span1.textContent = " ~";
  p.appendChild(span1);

  app.appendChild(p);
  const div = document.createElement("div");
  div.setAttribute("class", "type")
  const i = document.createElement("i");
  i.setAttribute("class", "fas fa-angle-right icone")
  const input = document.createElement("input");
  div.appendChild(i);
  div.appendChild(input);
  app.appendChild(div);
  input.focus();
}

function removeInput() {
  const div = document.querySelector(".type");
  app.removeChild(div);
}

function help() {
  for (let i = 0; i < commands.length; i++) {
    printCommand(commands[i].name, commands[i].desc);
  }
}

async function executeInput(command) {
  var value = "";
  if (command) {
    value = command;
  } else {
    value = document.querySelector("input").value;
  }
  removeInput();

  await showOutput(value);
  new_line();
}

async function showOutput(command) {
  if (command === "help") {
    trueValue(command);

    help();
  }
  else if (command === "clear") {
    document.querySelectorAll("p").forEach(e => e.parentNode.removeChild(e));
    document.querySelectorAll("section").forEach(e => e.parentNode.removeChild(e));
  }
  else if (command === "email") {
    trueValue(command);
    createText("Getting email address...");
    const email = await getEmailAddress();
    createText(`The email address is: <a href="mailto:${email}" target="_blank">${email}</a>`);
  }
  else {
    for (let i = 0; i < links.length; i++) {
      if (command === links[i].name) {
        trueValue(command);
        createText(`Opening ${links[i].name} (<a href="${links[i].url}" target="_blank">${links[i].url}</a>)`);
        scrollToBottom();
        await delay(400);
        window.open(links[i].url, "_blank");
        return;
      }
    }
    falseValue(command);
    createErrorText(`command not found: ${value}`)
  }
}

function trueValue(value) {
  const div = document.createElement("section");
  div.setAttribute("class", "type2")
  const i = document.createElement("i");
  i.setAttribute("class", "fas fa-angle-right icone")
  const mensagem = document.createElement("h2");
  mensagem.setAttribute("class", "sucess")
  mensagem.textContent = `${value}`;
  div.appendChild(i);
  div.appendChild(mensagem);
  app.appendChild(div);
}

function falseValue(value) {
  const div = document.createElement("section");
  div.setAttribute("class", "type2")
  const i = document.createElement("i");
  i.setAttribute("class", "fas fa-angle-right icone error")
  const mensagem = document.createElement("h2");
  mensagem.setAttribute("class", "error")
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

  // Add click event to the command
  cmdEle.addEventListener("click", async function () {
    await delay(150);
    await executeInput(command);
  });

  // make cursor pointer
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

open_terminal();

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
