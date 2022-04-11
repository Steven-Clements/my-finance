// ${ Import Dependencies }
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ${ Import Screens & Components }
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './screens/Dashboard';

// ${ Main <React> Process }
function App() {
  // < Return JSX Markup />
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={ <Dashboard /> } />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

// ${ Export <React> Application }
export default App;