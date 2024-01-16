import React from "../core/React.js";

// const App = React.createElement("div", { id: "app" }, "ni hao")

const AppOne = <div></div>

function Counter({ num }) {
  return <div>{num}</div>
}

function App() {
  return <div>
    hello world
    <Counter num={10}></Counter>
    <Counter num={20}></Counter>
  </div>
}
console.log(App, AppOne)
export default App;
