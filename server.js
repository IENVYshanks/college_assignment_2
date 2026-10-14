const http = require('node:http');
const path = require('node:path');
const { readFile } = require('node:fs/promises');

const DEFAULT_PORT = 3000;
const STUDENTS_FILE = path.join(__dirname, 'students.json');

async function readStudents() {
  const fileContents = await readFile(STUDENTS_FILE, 'utf8');
  const students = JSON.parse(fileContents);

  if (!Array.isArray(students)) {
    throw new TypeError('students.json must contain a JSON array');
  }

  return students;
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);

  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...extraHeaders,
  });
  response.end(payload);
}

function createStudentServer() {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      const segments = url.pathname.split('/').filter(Boolean);
      const isStudentsRoute = segments[0] === 'students' && segments.length <= 2;

      if (isStudentsRoute && request.method !== 'GET') {
        sendJson(
          response,
          405,
          { error: 'Method not allowed' },
          { Allow: 'GET' },
        );
        return;
      }

      if (request.method === 'GET' && segments.length === 1 && segments[0] === 'students') {
        const students = await readStudents();
        sendJson(response, 200, students);
        return;
      }

      if (request.method === 'GET' && segments.length === 2 && segments[0] === 'students') {
        let requestedId;

        try {
          requestedId = decodeURIComponent(segments[1]);
        } catch {
          sendJson(response, 400, { error: 'Invalid student ID' });
          return;
        }

        const students = await readStudents();
        const student = students.find(({ id }) => String(id) === requestedId);

        if (!student) {
          sendJson(response, 404, { error: `Student with ID ${requestedId} was not found` });
          return;
        }

        sendJson(response, 200, student);
        return;
      }

      sendJson(response, 404, { error: 'Route not found' });
    } catch (error) {
      console.error('Unable to process request:', error);

      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Unable to read student records' });
      } else {
        response.end();
      }
    }
  });
}

if (require.main === module) {
  const requestedPort = Number.parseInt(process.env.PORT, 10);
  const port = Number.isInteger(requestedPort) && requestedPort >= 0
    ? requestedPort
    : DEFAULT_PORT;

  const server = createStudentServer();
  server.listen(port, () => {
    const address = server.address();
    console.log(`Student records server is running at http://localhost:${address.port}`);
  });
}

module.exports = { createStudentServer, readStudents };
