import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import {Provider} from "react-redux"
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from 'react-router-dom'


const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkKey}>
      <BrowserRouter>
        <Toaster position='top-right'/>
        <App/>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
