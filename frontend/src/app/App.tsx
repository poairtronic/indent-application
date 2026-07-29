import React from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';
import '../styles/global.css';

const App: React.FC = () => {
  return (
    <AppProviders>
      <div className="app-container">
        <h1>Welcome to Indent Application</h1>
        <AppRouter />
      </div>
    </AppProviders>
  );
};

export default App;
