import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // React Query for data fetching

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable refetching on window focus (doesn't refetch while switching between tabs in the browser)
    },
  }
}); // Initialize a new QueryClient instance

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}> {/* Provide the QueryClient to the app */}
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
