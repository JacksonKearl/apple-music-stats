import { render } from "preact"
import { LocationProvider, Router, Route } from "preact-iso"
import { Home } from "./pages/Home"
import { NotFound } from "./pages/_404"
import "./style.css"
import { HowTo } from "./pages/HowTo"
import { Privacy } from "./pages/Privacy"

export function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={Home} />
        <Route path="/howto" component={HowTo} />
        <Route path="/privacy" component={Privacy} />
        <Route default component={NotFound} />
      </Router>
    </LocationProvider>
  )
}

render(<App />, document.getElementById("app")!)
