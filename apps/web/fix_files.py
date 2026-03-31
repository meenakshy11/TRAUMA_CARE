with open("/workspace/apps/web/public/index.html", "w") as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trauma Care Platform - Government of Kerala</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>""")
    print("index.html done")

with open("/workspace/apps/web/src/main.tsx", "w") as f:
    f.write("""import React from 'react'
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
""")
    print("main.tsx done")