import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { SkeletonTheme } from 'react-loading-skeleton'
import "leaflet/dist/leaflet.css";
import App from './App.jsx'
import AuthAxiosSetup from './components/auth/AuthAxiosSetup.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import {Provider} from "react-redux"
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from 'react-router-dom'
import { clerkAppearance } from './lib/clerkAppearance.js'


const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={clerkAppearance}
    >
      <BrowserRouter>
        <AuthAxiosSetup>
        <SkeletonTheme
          baseColor="#e2e8f0"
          highlightColor="#f1f5f9"
          borderRadius="0.5rem"
          duration={1.2}
        >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: "14px",
              fontWeight: 600,
              maxWidth: "420px",
            },
            success: {
              style: {
                background: "#ecfdf5",
                color: "#047857",
              },
            },
            error: {
              style: {
                background: "#fef2f2",
                color: "#b91c1c",
              },
            },
          }}
        />
        <App/>
        </SkeletonTheme>
        </AuthAxiosSetup>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
