# Internship Board REST API

## Overview
This backend provides a REST API for managing internship records and applications. It uses Node.js, Express.js, and SQLite for persistent data storage.

## Requirements
- Node.js 24 or compatible version
- npm
- Dependencies listed in package.json

## Setup on Windows PowerShell

1. Open PowerShell.
2. Navigate to the backend folder:
   cd backend
3. Install dependencies:
   npm.cmd install
4. Start the server:
   npm.cmd start

The API runs at http://localhost:3000.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Check API health |
| GET | /api/internships | Get internships with pagination |
| GET | /api/internships/:id | Get one internship |
| POST | /api/internships | Create an internship |
| PUT | /api/internships/:id | Update an internship |
| DELETE | /api/internships/:id | Delete an internship |
| POST | /api/applications | Submit an application |

## Pagination Example

GET http://localhost:3000/api/internships?page=1&limit=5

## Sample Request

POST http://localhost:3000/api/internships

Content-Type: application/json

{
  "id": "INT-106",
  "title": "Backend Developer Intern",
  "domain": "Full Stack Development",
  "mode": "Remote",
  "location": "India",
  "skills": "Node.js, Express, SQLite",
  "openings": 2
}

## Database

SQLite stores internship and application data persistently in internships.db. The database is created automatically when the server starts.

## Testing

The API health endpoint and internship listing endpoint have been tested locally. Additional endpoint tests should be performed before claiming full test coverage.

## Notes

- Keep node_modules and internships.db out of GitHub.
- The API is currently intended for local development.
- No public backend deployment is claimed.
