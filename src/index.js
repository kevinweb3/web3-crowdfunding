import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "./styles/globals.css";

import { StateContextProvider } from "./context";

const activeChain = "ethereum";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  // <React.StrictMode>
  //   <ThirdwebProvider
  //     activeChain={activeChain}
  //     clientId={process.env.REACT_APP_TEMPLATE_CLIENT_ID}
  //   >
  //     <App />
  //   </ThirdwebProvider>
  // </React.StrictMode>
  <ThirdwebProvider desiredChainId={ChainId.Goerli}>
    <Router>
      <StateContextProvider>
        <App />
      </StateContextProvider>
    </Router>
  </ThirdwebProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
