import React from 'react';
import './styles/login.css'
import ReactDOM from 'react-dom/client';
import { LoginPage } from './components/login-page';


const root = ReactDOM.createRoot(document.body);

root.render(
    <React.StrictMode>
        <LoginPage />
    </React.StrictMode>
);