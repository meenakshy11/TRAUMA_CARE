import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './styles/theme.css'
import './styles/leaflet-overrides.css'

const r = document.getElementById('root')
if (!r) throw new Error('no root element')
ReactDOM.createRoot(r).render(
  <React.StrictMode><App /></React.StrictMode>
)
