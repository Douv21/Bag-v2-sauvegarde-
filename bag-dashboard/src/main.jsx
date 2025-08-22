import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CategoryDocs from "./pages/CategoryDocs.jsx";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/docs/:categorie", element: <CategoryDocs /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
