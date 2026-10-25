# QuickNotes Architecture

## Requirements

Functional:
- Users sign up and log in.
- Users create, read, update and delete their own notes.
- Users add tags to notes and filter notes by tag.
- Users search their notes.

Non-functional:
- Handle 1 million registered users.
- Fast reads: a notes list loads in under 200 ms.
- Available 99.9% of the time, about 8.8 hours of downtime a year at most.
- Durable: a saved note is never lost.
- Secure: users can only reach their own notes.

## Load estimate for 1 million users

Assumptions: 20% of users are active each day (200,000), each views their notes 20 times a day and creates 5 notes a day. A note takes about 1 KB. Peak traffic is 5 times the average, and 1 day is 86,400 seconds.

- Reads per second: 200,000 x 20 = 4,000,000 a day, so about 46 on average and about 230 at peak.
- Writes per second: 200,000 x 5 = 1,000,000 a day, so about 12 on average and about 60 at peak.
- Storage per year: 1,000,000 notes a day x 365 x 1 KB = about 365 GB. With indexes and a replica copy, plan for about 1.1 TB.

The system is read-heavy, with about 4 reads for every write.

## Architecture diagram

```
Client (browser)
   |
   v
  DNS ------> CDN (static files: HTML, CSS, JS)
   |
   v
Load balancer
   |          |          |
   v          v          v
 App 1      App 2      App 3
   |  \        |        /
   |   +--> Cache (checked first for reads)
   |             |
   |          (miss)
   |             v
   |      DB read replica <--copies-- DB primary
   |                                     ^
   +-------------- writes ---------------+
   |
   +--> Queue --> Worker (search index, reminder emails)
```

## Components

- **Client:** the browser app that calls the API and shows notes to the user.
- **DNS:** turns the name quicknotes.example into the address of the load balancer, so users never need to know server addresses.
- **CDN:** serves the static files (HTML, CSS, JavaScript) from servers near the user, so pages load fast and our servers carry less traffic.
- **Load balancer:** spreads requests across the app servers and stops sending traffic to any server that is down.
- **App servers (two or more):** run the API logic and keep no state of their own, so we add more of them as traffic grows.
- **Cache:** keeps recent notes lists in memory so most reads never reach the database.
- **DB primary:** stores all the data and handles every write.
- **Read replica:** a live copy of the primary that handles reads, which spreads the load and keeps a second copy for safety.
- **Queue:** holds background jobs so an API request can finish before the slow work is done.
- **Worker:** takes jobs from the queue and does slow work such as updating the search index and sending reminder emails.

## Request flows

GET /notes:
1. The client asks DNS for the address and sends the request.
2. The load balancer picks an app server.
3. The app server checks the token and finds the user.
4. It looks in the cache for this user's notes list.
5. On a hit it returns the cached list with status 200.
6. On a miss it queries the read replica, stores the result in the cache for 60 seconds, and returns it with status 200.

POST /notes:
1. The client sends the new note and the request reaches an app server through the load balancer.
2. The app server checks the token and validates the title (required, 100 characters or fewer).
3. It writes the note and its tags to the DB primary in one transaction.
4. It deletes this user's cached lists, so the next read is fresh.
5. It puts an "index this note" message on the queue.
6. It returns the new note with status 201.
7. A worker later takes the message and updates the search index.

## Trade-offs

- **Cache freshness against speed:** cached lists are fast but can be out of date. We clear a user's cache on every write and keep a 60 second limit on every entry, so stale data lasts seconds at most.
- **Replication lag:** the replica copies the primary a moment later, so a user may create a note and briefly not see it in a replica read. We accept this for most reads, and for a short time after a user writes, we read their notes from the primary.
- **Queue and instant results:** background work keeps requests fast, but search results for a new note appear a few seconds late. This is acceptable for notes. It also adds one more system to run and monitor.

## Avoiding single points of failure

- App servers: several behind the load balancer, so one failing loses nothing.
- Load balancer: run as a pair, so if one fails the other takes over.
- DNS and CDN: managed services that already run in many locations.
- Cache: run with a replica, and if it fails the app falls back to the database.
- Database: if the primary fails, the replica is promoted to primary. We keep daily backups as a last resort.
- Queue and workers: the queue stores messages on disk and runs on more than one node, and several workers share the jobs. A failed job is retried.
