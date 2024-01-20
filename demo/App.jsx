import React from "../core/React.js";


let count = 10
function Counter({ num }) {
  function handleClick() {
    console.log("click")
    count++
    React.update()
  }
  return (
    <div>
      count:{count}
      <button onClick={handleClick}>click</button>
      <div>num-{num}</div>
    </div>
  )
}

function App() {
  return <div>
    hello world
    <Counter num={10}></Counter>
    <Counter num={20}></Counter>
  </div>
}

export default App;
