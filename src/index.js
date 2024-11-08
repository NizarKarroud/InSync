import React from 'react';
import './styles/login.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { LoginPage } from './components/login/loginpage';
import { ResetPage } from './components/login/reset_password';
import { LoginSection } from './components/login/loginsection';
import { ForgotPasswordSection } from './components/login/forgotpwdsection';
import { RegisterSection } from './components/login/registersection';

import { Dashboard } from './components/dashboard/dashboard';

const rootElement = document.getElementById('root');

const root = ReactDOM.createRoot(rootElement);

root.render(
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />}>
                    <Route index element={<LoginSection />} />
                    <Route path="login" element={<LoginSection />} />
                    <Route path="forgotPassword" element={<ForgotPasswordSection />} />
                    <Route path="register" element={<RegisterSection />} />
                    <Route path="reset_password" element={<ResetPage />} />

                </Route>
                <Route path="/dashboard" element={<Dashboard />} >

                </Route>
            </Routes>
        </Router>
);