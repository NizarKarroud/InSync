import React from 'react';
import './styles/login.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { LoginPage } from './components/login-page';
import { ResetPage } from './components/reset_password';

const root = ReactDOM.createRoot(document.body);

root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/user/reset_password" element={<ResetPage/>} />

            </Routes>
        </Router>
    </React.StrictMode>
);