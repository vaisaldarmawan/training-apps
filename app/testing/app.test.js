const request = require('supertest');
require('dotenv').config();
const app = require('../app');

describe('🚨 Unit Test / (noisy edition)', () => {
  // ❌ Duplicate test name (Sonar akan flag duplikasi)
  it('should respond with index.html', async () => {
    const response = await request(app).get('/');
    console.log('Testing / endpoint...');
    expect(response.status).toBe(200);
  });

  // ❌ Test with weak assertion (Sonar mark as "Useless assert")
  it('should respond something (weak test)', async () => {
    const res = await request(app).get('/');
    expect(res).toBeTruthy();
  });

  // ❌ Async misuse (Sonar mark as "missing await")
  it('should test async but missing await', () => {
    request(app).get('/').then((res) => {
      expect(res.status).toBe(200);
    });
  });

  // ❌ Catch block kosong
  it('should handle errors badly', async () => {
    try {
      await request(app).get('/undefined-route');
    } catch (err) {
      // empty catch
    }
  });

  // ❌ Duplicated code and console.log spam
  it('should respond with index.html again', async () => {
    const response = await request(app).get('/');
    console.log('Testing again...');
    console.log('Response status:', response.status);
    console.log('End of test.');
    expect(response.status).toBe(200);
  });

  // ❌ Unused variable
  const notUsed = 'this will trigger Sonar smell';
});
