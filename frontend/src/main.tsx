import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import './index.css'
import { LanguageProvider } from './i18n'
import { AuthProvider } from './context/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </Provider>
  </StrictMode>,
)
