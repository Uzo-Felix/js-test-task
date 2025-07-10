import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

let extensionContainer = null;
let root = null;
let isVisible = true;

function injectExtension() {
  if (document.getElementById("telegram-extension-root")) {
    return;
  }

  extensionContainer = document.createElement("div");
  extensionContainer.id = "telegram-extension-root";
  extensionContainer.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  extensionContainer.style.transition = "opacity 0.3s ease";

  document.body.appendChild(extensionContainer);

  root = ReactDOM.createRoot(extensionContainer);
  root.render(React.createElement(App));
}

function toggleExtension() {
  if (!extensionContainer) return;

  isVisible = !isVisible;
  extensionContainer.style.opacity = isVisible ? "1" : "0";
  extensionContainer.style.pointerEvents = isVisible ? "auto" : "none";
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    toggleExtension();
    sendResponse({ success: true });
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectExtension);
} else {
  injectExtension();
}
