const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { createStudentServer } = require('../server');

let server;
let baseUrl;

before(async () => {
  server = createStudentServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('handles concurrent student requests', async () => {
  const [allResponse, studentResponse] = await Promise.all([
    fetch(`${baseUrl}/students`),
    fetch(`${baseUrl}/students/2`),
  ]);

  assert.equal(allResponse.status, 200);
  assert.equal(studentResponse.status, 200);

  const students = await allResponse.json();
  const student = await studentResponse.json();

  assert.equal(students.length, 3);
  assert.equal(student.id, 2);
});

test('returns 404 when a student does not exist', async () => {
  const response = await fetch(`${baseUrl}/students/999`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.match(body.error, /was not found/);
});

test('returns 405 for unsupported methods', async () => {
  const response = await fetch(`${baseUrl}/students`, { method: 'POST' });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('returns 404 for unknown routes', async () => {
  const response = await fetch(`${baseUrl}/unknown`);

  assert.equal(response.status, 404);
});
