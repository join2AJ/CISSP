import React from "react";
import { createRoot } from "react-dom/client";
import App from "./field-guide.jsx";
// Mount into any element; StudyCISSP calls this when the guide page opens, grc.html mounts into #root.
let root = null;
window.mountGrcGuide = (el) => { if (root) root.unmount(); root = createRoot(el); root.render(<App />); };
const own = document.getElementById("root");
if (own) window.mountGrcGuide(own);
