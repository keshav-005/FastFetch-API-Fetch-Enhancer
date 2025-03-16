# FastFetch - Improve API Fetching with Auto-Retry and Deduplication

[![NPM version](https://img.shields.io/npm/v/@hoangsonw/fast-fetch.svg?style=flat&logo=npm)](https://www.npmjs.com/package/@hoangsonw/fast-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&logo=opensource)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D14-brightgreen.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Axios](https://img.shields.io/badge/Axios-1.3.0-blue.svg?style=flat&logo=axios)](https://github.com/axios/axios)

**FastFetch** is a smarter `fetch()` wrapper that adds **auto-retry** and **request deduplication** to standard HTTP requests, reducing boilerplate and increasing resilience. It is designed to work seamlessly in both Node.js and browser environments using modern ES modules.

Currently live on NPM at [https://www.npmjs.com/package/@hoangsonw/fast-fetch](https://www.npmjs.com/package/@hoangsonw/fast-fetch). This package is a work in progress, and we welcome contributions and feedback!

> Note: Currently, **FastFetch** does not support caching. For caching, consider using [GhostCache](https://www.npmjs.com/package/ghost-cache) in conjunction with FastFetch :)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Usage with Fetch](#basic-usage-with-fetch)
  - [Using FastFetch with Auto-Retry & Deduplication](#using-fastfetch-with-auto-retry--deduplication)
  - [Using FastFetch with Axios](#using-fastfetch-with-axios)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Advanced Examples](#advanced-examples)
- [Testing](#testing)
- [Demo Script](#demo-script)
- [License](#license)
- [Contributing](#contributing)

## Features

- **Auto-Retry:** Automatically retries failed HTTP requests with configurable delay and retry count.
- **Request Deduplication:** Merges multiple identical in-flight requests into a single network call.
- **Minimal Boilerplate:** Wraps the native `fetch()` function with enhanced functionality.
- **TypeScript Support:** Fully written in TypeScript with complete type definitions.
- **ESM Compatible:** Compiled using NodeNext module resolution for seamless ESM integration.

## Installation

### Prerequisites

- Node.js v14 or higher
- npm v6 or higher

### Installing via NPM

```bash
npm install @hoangsonw/fast-fetch
```

### Installing via Yarn

```bash
yarn add @hoangsonw/fast-fetch
```

## Usage

FastFetch can be used as a drop-in replacement for the native `fetch()` function with additional options.

### Basic Usage with Fetch

Below is a simple example that uses FastFetch to make an API call and print the results:

```js
import { fastFetch } from "@hoangsonw/fast-fetch";

fastFetch("https://pokeapi.co/api/v2/pokemon/ditto")
  .then((res) => res.json())
  .then((data) => {
    console.log("Fetched data:", data);
  })
  .catch((err) => console.error("Fetch error:", err));
```

### Using FastFetch with Auto-Retry & Deduplication

FastFetch supports auto-retry and deduplication through additional options. For example, you can automatically retry up to 2 times with a delay of 2000ms between attempts, and deduplicate in-flight requests:

```js
import { fastFetch } from "@hoangsonw/fast-fetch";

fastFetch("https://pokeapi.co/api/v2/pokemon/ditto", {
  retries: 2,
  retryDelay: 2000,
  deduplicate: true,
  shouldRetry: (errorOrResponse, attempt) => {
    console.log(`Retry attempt #${attempt}`);
    // If response exists and status is 5xx, retry
    if (errorOrResponse instanceof Response) {
      return errorOrResponse.status >= 500;
    }
    // For network errors or other errors, retry
    return true;
  }
})
  .then((res) => res.json())
  .then((data) => console.log("FastFetch data:", data))
  .catch((err) => console.error("FastFetch error:", err));
```

### Using FastFetch with Axios

FastFetch can deduplicate in-flight requests even when used alongside Axios by registering an Axios instance. This means if multiple identical requests are made concurrently via Axios, only one network call is performed.

```js
import axios from "axios";
import { fastFetch, registerAxios } from "@hoangsonw/fast-fetch";

// Create an Axios instance
const api = axios.create({ baseURL: "https://pokeapi.co/api/v2" });

// Register the Axios instance with FastFetch
registerAxios(api);

api.get("/pokemon/ditto")
  .then((response) => {
    console.log("Axios fetched data:", response.data);
  })
  .catch((error) => {
    console.error("Axios error:", error);
  });
```

## API Reference

### `fastFetch(input: RequestInfo, init?: RequestInit & FastFetchOptions): Promise<Response>`

- **Parameters:**
  - `input`: URL or Request object.
  - `init`: An object that extends standard `RequestInit` with additional options:
    - `retries`: _number_ — Number of retry attempts (default: `0`).
    - `retryDelay`: _number_ — Delay in milliseconds between retries (default: `1000`).
    - `deduplicate`: _boolean_ — Whether to deduplicate in-flight requests (default: `true`).
    - `shouldRetry`: _function_ — A custom function `(errorOrResponse: Response | Error, attempt: number) => boolean` that determines whether to retry based on error or response status.

- **Returns:**  
  A `Promise` that resolves to a `Response` object.

### Additional Exports

- **`registerAxios(instance: AxiosInstance): void`**  
  Registers an Axios instance so that FastFetch can deduplicate in-flight requests for Axios as well.

- **Other functions:**  
  FastFetch only wraps the native `fetch()` and does not cache responses (use GhostCache if caching is required).

## Configuration Options

- **retries**: Number of times to retry the fetch on failure.
- **retryDelay**: Delay (in milliseconds) before retrying.
- **deduplicate**: When set to `true`, identical in-flight requests are deduplicated.
- **shouldRetry**: Custom function to decide whether to retry a request based on error or response.

## Advanced Examples

### Custom Retry Logic

Implement custom logic to only retry on specific HTTP status codes:

```js
import { fastFetch } from "@hoangsonw/fast-fetch";

fastFetch("https://example.com/api/data", {
  retries: 3,
  retryDelay: 1500,
  shouldRetry: (errorOrResponse, attempt) => {
    if (errorOrResponse instanceof Response) {
      // Only retry for server errors
      return errorOrResponse.status >= 500;
    }
    return true;
  }
})
  .then((res) => res.json())
  .then((data) => console.log("Custom retry data:", data))
  .catch((err) => console.error("Error with custom retry:", err));
```

### Deduplication in Action

Demonstrate deduplication by firing multiple identical requests simultaneously:

```js
import { fastFetch } from "@hoangsonw/fast-fetch";

const url = "https://pokeapi.co/api/v2/pokemon/ditto";

// Fire two identical requests concurrently.
Promise.all([fastFetch(url), fastFetch(url)])
  .then(async ([res1, res2]) => {
    const data1 = await res1.json();
    const data2 = await res2.json();
    console.log("Deduplication demo, data1:", data1);
    console.log("Deduplication demo, data2:", data2);
  })
  .catch((err) => console.error("Deduplication error:", err));
```

## Testing

FastFetch comes with a Jest test suite. To run tests:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

Example test files (found in the `__tests__` directory) demonstrate auto-retry, deduplication, and basic fetch functionality.

## Demo Script

A demo script is included in the `__tests__` directory. To run the demo:

```bash
npm run demo
```

It will execute a series of fetch requests and demonstrate the auto-retry and deduplication features.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Commit Your Changes**
4. **Submit a Pull Request**

For major changes, please open an issue first to discuss your ideas.

## License

This project is licensed under the MIT License.

## Final Remarks

FastFetch is designed to enhance the native `fetch()` experience by adding auto-retry and deduplication features, making your API requests more robust and efficient without caching (use GhostCache for caching). Enjoy building resilient applications!

Happy fetching! 🚀
