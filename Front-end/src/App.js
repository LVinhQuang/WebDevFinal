import './App.css';
import Home from "./pages/Home.js";
/* import Detail from "./pages/Detail.js";
import Cart from "./pages/Cart.js";
import ProductList from "./pages/ProductList.js" */
import Product from './pages/Admin/Products.js';
import { useContext, useEffect, useState } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthContext } from './context/AuthContext.js';

// import hook
import AuthHook from './hooks/auth-hook.js'

import Shop from './Customer'
import Admin from './Admin'
import AccountLayout from './pages/AccountLayout.js';
import AccountDashboard from "./components/Account/Dashboard.js"
import Orders from "./components/Account/Orders.js";
import Password from "./components/Account/Password.js";
import Transaction from './components/Account/Transaction.js';
import EditInfo from "./components/Account/EditInfo.js";
import Auth from './pages/Auth.js'
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import TopUp from './components/Account/TopUp.js';
function App() {
  const [inPath, setInPath] = useState()
  const [login, logout, token, userId, role] = AuthHook();
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    console.log("app userid", userId);
    console.log("role in app", role);
  }, [])

  useEffect(() => {
    setInPath(location.pathname)
    if (location.pathname === "/") {
      navigate('/home')
    }
  }, [])
  console.log(inPath)
  useEffect(() => {
    if (token) {
      navigate(inPath)
    }
  }, [token])

  return (
    <>

      <AuthContext.Provider
        value={
          {
            isLoggedIn: !!token,
            login,
            logout,
            userId,
            role,
            token
          }
        }
      >
        <Routes>

          <Route path='/home' exact element={<Home />} />
          {/* <Route path=''exact element={<Navigate to="/home" />} /> */}
          <Route path='/*' element={<Shop />} />
          <Route path='/admin/*' element={<Admin />} />
          {(
            <Route path="/account" element={<AccountLayout />}>
              {token &&
                <>
                  <Route index element={<AccountDashboard />} />
                  <Route path="editinfo" element={<EditInfo />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="password" element={<Password />} />
                  <Route path="transaction" element={<Transaction />} />
                  <Route path='topup' element={<TopUp />} />
                </>
              }
            </Route>
          )}
          {
            !token &&
            <>
              <Route path="/login" element={<Auth />} />
              <Route path="/*" element={<Navigate to="/login" />} />
            </>
          }

        </Routes>
      </AuthContext.Provider>

    </>
  );
}

export default App;