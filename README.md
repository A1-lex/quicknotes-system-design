# QuickNotes System Design

QuickNotes is moving from a browser-only app to an online service for 1 million users. This repository has two parts. The first is a small web client that talks to the JSONPlaceholder practice API using fetch, to prove the front end can load, create and delete notes. The second is a set of design documents that describe the real backend: its API, its database and its architecture.

## How to run the API client

1. Clone the repository: `git clone https://github.com/A1-lex/quicknotes-system-design.git`
2. Open the `quicknotes-system-design` folder.
3. Open `index.html` in your browser, or serve the folder with `python3 -m http.server 8000` and visit `http://localhost:8000`.
4. Click **Load notes** to load 10 notes, use the form to add one, and use **Delete** to remove one.

You need an internet connection, because the client calls https://jsonplaceholder.typicode.com/posts. That API does not really store changes, so created notes disappear when you reload the page.

## Design documents

- [API design](docs/api-design.md): the REST endpoints, JSON examples and error codes
- [Data model](docs/data-model.md): the four tables, relationships, SQL, an index and the SQL or NoSQL choice
- [Architecture](docs/architecture.md): requirements, load estimate, diagram, request flows and trade-offs

## What I learned

- Talking to an API: one reusable `request()` function, `response.ok` checks, and loading, success, error and empty states.
- Designing an API: REST paths, methods, status codes and error bodies.
- Modelling data: one-to-many with a foreign key, many-to-many with a join table.
- Planning for scale: turning 1 million users into reads and writes per second.
- Choosing components: a cache, a replica and a queue each solve one problem and cost something else.
