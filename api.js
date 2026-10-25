const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE = 100;

const loadBtn = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");

let notes = [];
let nextNewKey = 1;

// The API returns Latin placeholder text, so we show our own English
// text on the same 10 posts. The request and the ids are still real.
const ENGLISH_NOTES = [
  { title: "Pele and the World Cup", body: "Pele is the only player to win three World Cups, in 1958, 1962 and 1970." },
  { title: "Klose, the top scorer", body: "Miroslav Klose scored 16 World Cup goals, the most by any player." },
  { title: "Fontaine in 1958", body: "Just Fontaine scored 13 goals at the 1958 World Cup, still the record for one tournament." },
  { title: "Brazil's five stars", body: "Brazil have won the World Cup five times, more than any other country." },
  { title: "The first World Cup", body: "Uruguay hosted and won the first World Cup in 1930." },
  { title: "Honey never spoils", body: "Edible honey has been found in Egyptian tombs thousands of years old." },
  { title: "Three hearts", body: "An octopus has three hearts and blue blood." },
  { title: "Africa's highest peak", body: "Mount Kilimanjaro rises 5,895 metres above sea level." },
  { title: "Bananas are berries", body: "Botanically, a banana is a berry, but a strawberry is not." },
  { title: "Sunlight takes a trip", body: "Light from the Sun takes about 8 minutes to reach Earth." },
];

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

// Stops the user starting a second request while one is running
function setBusy(busy) {
  loadBtn.disabled = busy;
  submitBtn.disabled = busy;
  for (const btn of document.querySelectorAll(".delete-btn")) {
    btn.disabled = busy;
  }
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

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteNote(note));

    li.append(title, body, deleteBtn);
    notesList.append(li);
  }
}

// GET: load 10 notes
async function loadNotes() {
  setBusy(true);
  setStatus("Loading notes...", "loading");
  notesList.textContent = "";

  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = result.data.map((post, i) => ({ ...post, ...ENGLISH_NOTES[i], key: `post-${post.id}` }));
    renderNotes(notes);
    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    notes = [];
    setStatus("Sorry, we could not load your notes. Please check your connection and try again.", "error");
  } finally {
    setBusy(false);
  }
}

// POST: create a note
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (title === "") {
    setStatus("Please enter a title.", "error");
    return;
  }
  if (title.length > MAX_TITLE) {
    setStatus(`Title must be ${MAX_TITLE} characters or fewer.`, "error");
    return;
  }

  setBusy(true);
  setStatus("Saving note...", "loading");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body, userId: 1 }),
    });

    notes.unshift({ ...result.data, key: `new-${nextNewKey++}` });
    renderNotes(notes);
    setStatus(`Note created (status ${result.status}, id ${result.data.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus("Sorry, we could not save your note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

// DELETE: remove a note
// JSONPlaceholder fakes writes. It replies as if a delete worked but
// stores nothing, and notes we create are never really saved. So we send
// the DELETE request anyway, trust the success status, and remove the
// note from our own list. A real API would work the same way, but the
// record would really be gone. Every created note also comes back with
// the same id (101), so we match notes by our own key, not by id.
async function deleteNote(note) {
  setBusy(true);
  setStatus("Deleting note...", "loading");

  try {
    const result = await request(`${API_URL}/${note.id}`, { method: "DELETE" });
    notes = notes.filter((n) => n.key !== note.key);
    renderNotes(notes);
    setStatus(`Note deleted (status ${result.status}).`, "success");
  } catch (error) {
    setStatus("Sorry, we could not delete that note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

