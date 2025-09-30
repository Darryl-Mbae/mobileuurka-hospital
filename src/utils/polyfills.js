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

// URL.parse polyfill (for older browsers)
if (!URL.parse) {
  URL.parse = function (url, base) {
    try {
      return new URL(url, base);
    } catch (error) {
      return null;
    }
  };
}

// URL constructor polyfill for very old browsers
if (typeof URL === 'undefined' || !URL) {
  window.URL = function(url, base) {
    // Very basic URL parsing for compatibility
    const a = document.createElement('a');
    if (base) {
      const baseA = document.createElement('a');
      baseA.href = base;
      a.href = new URL(url, baseA.href).href;
    } else {
      a.href = url;
    }
    
    return {
      href: a.href,
      protocol: a.protocol,
      host: a.host,
      hostname: a.hostname,
      port: a.port,
      pathname: a.pathname,
      search: a.search,
      hash: a.hash,
      origin: a.protocol + '//' + a.host
    };
  };
  
  // Add static parse method
  window.URL.parse = function(url, base) {
    try {
      return new window.URL(url, base);
    } catch (error) {
      return null;
    }
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

  // Handle specific compatibility issues
  if (event.message && event.message.includes("Promise.withResolvers")) {
    console.warn("Browser compatibility issue: Promise.withResolvers not supported. Polyfill should handle this.");
  }
  
  if (event.message && event.message.includes("URL.parse")) {
    console.warn("Browser compatibility issue: URL.parse not supported. Polyfill should handle this.");
  }
  
  if (event.message && event.message.includes("URL")) {
    console.warn("Browser compatibility issue: URL constructor issues detected.");
  }
});

// Additional polyfills for older browsers

// Array.prototype.find polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = parseInt(list.length) || 0;
    var thisArg = arguments[1];
    for (var i = 0; i < length; i++) {
      var element = list[i];
      if (predicate.call(thisArg, element, i, list)) {
        return element;
      }
    }
    return undefined;
  };
}

// Array.prototype.findIndex polyfill
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = parseInt(list.length) || 0;
    var thisArg = arguments[1];
    for (var i = 0; i < length; i++) {
      var element = list[i];
      if (predicate.call(thisArg, element, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('Array.prototype.includes called on null or undefined');
    }
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(fromIndex) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {
        k = 0;
      }
    }
    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    for (; k < len; k++) {
      if (sameValueZero(O[k], searchElement)) {
        return true;
      }
    }
    return false;
  };
}

// Font loading polyfill for older browsers
if (!('fonts' in document)) {
  // Create a simple fonts object for older browsers
  document.fonts = {
    check: function() {
      return false; // Always return false for older browsers
    },
    load: function() {
      return Promise.resolve();
    },
    ready: Promise.resolve()
  };
}

// CSS.supports polyfill
if (!window.CSS || !CSS.supports) {
  window.CSS = window.CSS || {};
  CSS.supports = function(property, value) {
    // Basic feature detection
    var element = document.createElement('div');
    try {
      element.style[property] = value;
      return element.style[property] === value;
    } catch (e) {
      return false;
    }
  };
}

// FontFace constructor polyfill (basic)
if (!window.FontFace) {
  window.FontFace = function(family, source, descriptors) {
    this.family = family;
    this.source = source;
    this.descriptors = descriptors || {};
    this.status = 'unloaded';
    
    this.load = function() {
      return Promise.resolve(this);
    };
  };
}

// Cache detection and debugging
const cacheInfo = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  hasPromiseWithResolvers: !!Promise.withResolvers,
  location: window.location.href
};

console.log("✅ Polyfills loaded successfully", cacheInfo);

// Add specific debugging for Promise.withResolvers
if (!Promise.withResolvers) {
  console.error("❌ Promise.withResolvers polyfill failed to load!");
} else {
  console.log("✅ Promise.withResolvers is available");
  
  // Test the polyfill
  try {
    const { promise, resolve, reject } = Promise.withResolvers();
    resolve("test");
    promise.then(() => console.log("✅ Promise.withResolvers test passed"));
  } catch (error) {
    console.error("❌ Promise.withResolvers test failed:", error);
  }
}
