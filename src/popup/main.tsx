// src/main.tsx
import "./../index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import PopUp from "./PopUp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopUp />
  </React.StrictMode>
);
