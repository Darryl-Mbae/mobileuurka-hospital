// Polyfills for older browsers and devices

// Promise.withResolvers polyfill
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Array.prototype.at polyfill (for older Safari versions)
if (!Array.prototype.at) {
  Array.prototype.at = function (index) {
    // Convert negative indices to positive
    const len = this.length;
    const relativeIndex = index < 0 ? len + index : index;

    // Return undefined if index is out of bounds
    if (relativeIndex < 0 || relativeIndex >= len) {
      return undefined;
    }

    return this[relativeIndex];
  };
}

// String.prototype.replaceAll polyfill (for older browsers)
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (searchValue, replaceValue) {
    if (typeof searchValue === "string") {
      return this.split(searchValue).join(replaceValue);
    }
    // If searchValue is a RegExp, use the original replace method
    return this.replace(searchValue, replaceValue);
  };
}

// Object.hasOwn polyfill (for older browsers)
if (!Object.hasOwn) {
  Object.hasOwn = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// Add global error handler for unhandled promise rejections
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent the default behavior (which would log to console)
  event.preventDefault();
});

// Add global error handler for JavaScript errors
window.addEventListener("error", function (event) {
  console.error("Global error:", event.error || event.message);

  // If it's a Promise.withResolvers error, show a user-friendly message
  if (event.message && event.message.includes("Promise.withResolvers")) {
    console.warn(
      "Browser compatibility issue detected. Polyfill should handle this."
    );
  }
});

console.log("✅ Polyfills loaded successfully");
