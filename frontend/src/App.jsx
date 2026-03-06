import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Header          from "./Components/Header";
import Dashboard       from "./pages/Dashboard";
import VideoPlayerPage from "./pages/VideoPlayer";
import Notes           from "./pages/Notes";
import Developer       from "./pages/Developer";
import "../index.css";

// VideoPlayer, Notes, Developer all share the Header nav
const Layout = () => (
  <div className="h-screen flex flex-col bg-[#222222]">
    <Header />
    <div className="flex-1 overflow-auto">
      <Outlet />
    </div>
  </div>
);

const router = createBrowserRouter([
  // Dashboard is standalone — no Header
  { path: "/", element: <Dashboard /> },

  // These three share the Header with Home/Notes/Developer links
  {
    element: <Layout />,
    children: [
      { path: "/player/:videoId", element: <VideoPlayerPage /> },
      { path: "/notes",           element: <Notes /> },
      { path: "/developer",       element: <Developer /> },
    ],
  },
]);

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);