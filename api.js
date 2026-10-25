const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];

// One reusable function for every request
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
  };
}

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

function renderNotes(list) {
  notesList.textContent = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.classList.add("empty-message");
    li.textContent = "No notes to show yet.";
    notesList.append(li);
    return;
  }

  for (const note of list) {
    const li = document.createElement("li");
    li.classList.add("note");

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body;

    li.append(title, body);
    notesList.append(li);
  }
}

// GET: load 10 notes
async function loadNotes() {
  loadBtn.disabled = true;
  setStatus("Loading notes...", "loading");
  notesList.textContent = "";

  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = result.data;
    renderNotes(notes);
    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    notes = [];
    setStatus("Sorry, we could not load your notes. Please check your connection and try again.", "error");
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
