# Student Records Server

A dependency-free Node.js HTTP server that reads student records from
`students.json` using asynchronous file operations.

## Run the server

```bash
npm start
```

The server listens on `http://localhost:3000` by default. Set the `PORT`
environment variable to use another port.

## Endpoints

- `GET /students` returns every student.
- `GET /students/:id` returns the student with the matching ID.

Examples:

```bash
curl http://localhost:3000/students
curl http://localhost:3000/students/2
```

