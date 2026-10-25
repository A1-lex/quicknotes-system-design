# QuickNotes API Design

A REST API for the real QuickNotes service. All requests and responses use JSON. Every request needs the header `Authorization: Bearer <token>`, and a user can only reach their own notes.

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| GET | `/notes` | List the user's notes, newest first. Supports `?page=1&limit=10`. | 200 OK |
| GET | `/notes/{id}` | Get one note with its tags. | 200 OK |
| POST | `/notes` | Create a note. | 201 Created |
| PUT | `/notes/{id}` | Replace the title, body and tags of a note. | 200 OK |
| PATCH | `/notes/{id}` | Change only the fields sent, for example the title. | 200 OK |
| DELETE | `/notes/{id}` | Delete a note. | 204 No Content |
| GET | `/notes?tag=urgent` | List only the notes that have the tag "urgent". | 200 OK |
| GET | `/tags` | List all tags used by the user. | 200 OK |

## Create a note

`POST /notes`

Request body:

```json
{
  "title": "Buy milk",
  "body": "Two litres of fresh milk",
  "tags": ["personal", "urgent"]
}
```

Response, status 201 Created:

```json
{
  "id": 42,
  "title": "Buy milk",
  "body": "Two litres of fresh milk",
  "tags": ["personal", "urgent"],
  "userId": 1,
  "createdAt": "2026-10-26T09:30:00Z"
}
```

## List notes

`GET /notes?page=1&limit=2`

Response, status 200 OK:

```json
{
  "data": [
    {
      "id": 42,
      "title": "Buy milk",
      "body": "Two litres of fresh milk",
      "tags": ["personal", "urgent"],
      "createdAt": "2026-10-26T09:30:00Z"
    },
    {
      "id": 41,
      "title": "Revise SQL joins",
      "body": "",
      "tags": ["study"],
      "createdAt": "2026-10-25T18:10:00Z"
    }
  ],
  "page": 1,
  "limit": 2,
  "total": 17
}
```

An empty list is not an error. It returns status 200 with `"data": []`.

## Error codes

| Status | Meaning | Example of when it happens |
|---|---|---|
| 400 Bad Request | The request is invalid. | `POST /notes` with an empty title, or a title over 100 characters. |
| 401 Unauthorized | The user is not logged in. | Any request with a missing or expired token. |
| 403 Forbidden | Logged in, but not allowed. | `DELETE /notes/42` when note 42 belongs to another user. |
| 404 Not Found | The note does not exist. | `GET /notes/9999` when no note has that id. |
| 500 Internal Server Error | The server failed. | The database is unreachable while saving a note. |

Every error uses the same body:

```json
{
  "error": {
    "status": 400,
    "message": "Title is required and must be 100 characters or fewer."
  }
}
```
