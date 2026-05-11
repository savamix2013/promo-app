const http = require("http");

const BASE_HOST = "127.0.0.1";
const BASE_PORT = 3111;

function makeRequest(method, requestPath, requestBody) {
  return new Promise(function (resolve, reject) {
    const options = {
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: requestPath,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    const request = http.request(options, function (response) {
      let responseBody = "";
      response.on("data", function (chunk) {
        responseBody = responseBody + chunk;
      });
      response.on("end", function () {
        resolve({ statusCode: response.statusCode, body: responseBody });
      });
    });
    request.on("error", function (requestError) {
      reject(requestError);
    });
    if (requestBody) {
      request.write(JSON.stringify(requestBody));
    }
    request.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  try {
    const result = await makeRequest("GET", "/health");
    const data = JSON.parse(result.body);
    if (result.statusCode === 200 && data.status === "ok") {
      console.log("GET /health");
      passed++;
    } else {
      console.log("GET /health - статус " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("GET /health - " + testError.message);
    failed++;
  }

  try {
    const result = await makeRequest("GET", "/promos");
    const data = JSON.parse(result.body);
    if (result.statusCode === 200 && data.success === true) {
      console.log("GET /promos");
      passed++;
    } else {
      console.log("GET /promos - статус " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("GET /promos - " + testError.message);
    failed++;
  }

  try {
    const result = await makeRequest("GET", "/promos/stores");
    const data = JSON.parse(result.body);
    if (result.statusCode === 200 && data.success === true) {
      console.log("GET /promos/stores");
      passed++;
    } else {
      console.log("GET /promos/stores - статус " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("GET /promos/stores - " + testError.message);
    failed++;
  }

  try {
    const result = await makeRequest("GET", "/promos/categories");
    const data = JSON.parse(result.body);
    if (result.statusCode === 200 && data.success === true) {
      console.log("GET /promos/categories");
      passed++;
    } else {
      console.log("GET /promos/categories - статус " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("GET /promos/categories - " + testError.message);
    failed++;
  }

  try {
    const result = await makeRequest("POST", "/auth/register", {
      name: "",
      email: "bad",
      password: "1",
    });
    if (result.statusCode === 400) {
      console.log("POST /auth/register - валідація відхилила некоректні дані");
      passed++;
    } else {
      console.log("POST /auth/register - очікувано 400, отримано " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("POST /auth/register - " + testError.message);
    failed++;
  }

  try {
    const result = await makeRequest("POST", "/auth/login", {
      email: "",
      password: "",
    });
    if (result.statusCode === 400) {
      console.log("POST /auth/login - валідація відхилила порожні поля");
      passed++;
    } else {
      console.log("POST /auth/login - очікувано 400, отримано " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("POST /auth/login - " + testError.message);
    failed++;
  }

  try {
    const result = await makeRequest("GET", "/auth/me");
    if (result.statusCode === 401) {
      console.log("GET /auth/me - без токена повертає 401");
      passed++;
    } else {
      console.log("GET /auth/me - очікувано 401, отримано " + result.statusCode);
      failed++;
    }
  } catch (testError) {
    console.log("GET /auth/me - " + testError.message);
    failed++;
  }

  console.log(passed + " пройшло, " + failed + " не пройшло");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
