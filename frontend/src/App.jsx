import Navbar from "./components/Navbar.jsx";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";

export default function App() {
  return (
    <DarkModeProvider>
      <Navbar />
    </DarkModeProvider>
  );
}
