import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemsPage from './pages/ItemsPage';
import FormulariosPage from './pages/FormulariosPage';
import FormularioEditPage from './pages/FormularioEditPage';

function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/formularios" element={<FormulariosPage />} />
          <Route path="/formularios/new" element={<FormularioEditPage />} />
          <Route path="/formularios/:id/edit" element={<FormularioEditPage />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}

export default App;
