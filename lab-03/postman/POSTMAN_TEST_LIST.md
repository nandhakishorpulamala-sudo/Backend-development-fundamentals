# Postman test list

Import `lab-03.postman_collection.json`. The collection variable `baseUrl` defaults to
`http://localhost:3000`; change it to the deployed URL to test the live server.
Run **Success cases** first (POST stores `bookId`, which PUT and DELETE reuse), then **Failure cases**.

## Success cases

| # | Request | Expected status | What it proves |
|---|---------|-----------------|----------------|
| 1 | `GET /books` | 200 | Defaults: limit 10, offset 0, order by id ASC |
| 2 | `GET /books?search_q=java` | 200 | Partial, case-insensitive title match (LIKE) |
| 3 | `GET /books?order_by=price&order=DESC` | 200 | Sorting |
| 4 | `GET /books?limit=5&offset=5` | 200 | Pagination (second page) |
| 5 | `GET /books?min_price=300&max_price=500` | 200 | Price range (BETWEEN) |
| 6 | `GET /books?search_q=java&max_price=300&order_by=price&order=ASC&limit=5` | 200 | Filters combine |
| 7 | `GET /books/1` | 200 | Single record |
| 8 | `POST /books` valid body | 201 | Create |
| 9 | `PUT /books/{{bookId}}` valid body | 200 | Update |
| 10 | `DELETE /books/{{bookId}}` | 200 | Delete |

## Failure cases

| # | Request | Expected status | Reason |
|---|---------|-----------------|--------|
| 11 | `POST /books` without `title` | 400 | Missing field |
| 12 | `POST /books` without `author` | 400 | Missing field |
| 13 | `POST /books` without `price` | 400 | Missing field |
| 14 | `POST /books` with `"price": "abc"` | 400 | Non-numeric price |
| 15 | `POST /books` with `"price": -5` | 400 | Negative price |
| 16 | `POST /books` with malformed JSON | 400 | Invalid body |
| 17 | `PUT /books/1` with only `title` | 400 | Missing fields |
| 18 | `GET /books?order_by=password` | 400 | Column not in whitelist |
| 19 | `GET /books?order=sideways` | 400 | Not ASC/DESC |
| 20 | `GET /books?limit=0` | 400 | Out of range |
| 21 | `GET /books?limit=abc` | 400 | Not an integer |
| 22 | `GET /books?min_price=500&max_price=100` | 400 | Inverted range |
| 23 | `GET /books/abc` | 400 | Invalid id format |
| 24 | `GET /books/99999` | 404 | Record does not exist |
| 25 | `PUT /books/99999` | 404 | Record does not exist |
| 26 | `DELETE /books/99999` | 404 | Record does not exist |
| 27 | `GET /authors` | 404 | Unknown route |

All error bodies have the shape `{ "message": "..." }`.
