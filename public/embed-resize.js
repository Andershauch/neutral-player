/*
 * Neutralplayer embed resize helper (optional).
 * Lets the embed grow and shrink when the viewer opens the text version.
 * Reads the origin from its own src, only trusts messages from that origin and
 * from an iframe on this page, and uses no cookies or tracking.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.src) return;

  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch {
    return;
  }

  // One listener per page, even if the script is included for several embeds.
  if (window.__neutralplayerResize) return;
  window.__neutralplayerResize = true;

  var MIN_HEIGHT = 120;
  var MAX_HEIGHT = 5000;

  function findFrame(source) {
    var frames = document.getElementsByTagName("iframe");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === source) return frames[i];
    }
    return null;
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.type !== "neutralplayer:height") return;
    if (typeof data.height !== "number" || !isFinite(data.height)) return;

    var frame = findFrame(event.source);
    if (!frame || !frame.parentElement) return;

    var height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(data.height)));
    var wrapper = frame.parentElement;
    wrapper.style.paddingTop = "0";
    wrapper.style.height = height + "px";

    // Tell the embed that resizing works, so it can stop limiting the text height.
    event.source.postMessage({ type: "neutralplayer:resize-active" }, origin);
  });

  // If the embed loaded before this script, it never got an answer: ask it to report again.
  var frames = document.getElementsByTagName("iframe");
  for (var i = 0; i < frames.length; i++) {
    var src = frames[i].getAttribute("src") || "";
    if (src.indexOf(origin + "/embed/") === 0 && frames[i].contentWindow) {
      frames[i].contentWindow.postMessage({ type: "neutralplayer:parent-ready" }, origin);
    }
  }
})();
