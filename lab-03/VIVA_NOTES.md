# Viva notes (not part of the submission; for your own revision)

**Query parameter vs path parameter?**
A path parameter identifies *which resource*: `/books/5` (id 5). It is part of the route and normally required.
A query parameter *modifies how you view a collection*: `/books?search_q=java&limit=5`. It comes after `?`, is optional and has defaults.
In Express: `req.params.id` vs `req.query.search_q`.

**What does stateless mean?**
The server keeps no memory of the client between requests. Every request carries everything needed to process it
(URL, method, body, headers/token). Any server instance can answer any request, which makes APIs easy to scale and cache.

**Which status code for bad input vs a missing record?**
Bad input → **400 Bad Request** (the client sent something invalid, e.g. price "abc").
Missing record → **404 Not Found** (valid request, but id 99999 does not exist).
Also: 201 Created after POST, 200 OK after PUT/DELETE.

**Likely follow-ups**
- *Why whitelist `order_by`?* Column names cannot be parameterised; joining user input there would allow SQL injection.
- *Why `LIMIT/OFFSET`?* Pagination: avoids returning thousands of rows at once.
- *PUT vs PATCH?* PUT replaces the whole resource (all fields required here); PATCH changes only the fields sent.
- *Why `await`?* DB calls are asynchronous and return Promises; without `await` you use the Promise, not the data.
