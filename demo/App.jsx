import React from "../core/React.js";


let show = false
function Counter({ num }) {
  // const Foo = <div>foo</div>
  function Foo() {
    return <div>foo</div>
  }
  const Bar = <div>bar</div>
  function handleClick() {
    console.log("click")
    show = !show
    React.update()
  }
  return (
    <div>
      {show && Bar}
      <button onClick={handleClick}>show</button>
    </div>
  )
}

function App() {
  return <div>
    hello world
    <Counter num={10}></Counter>
  </div>
}

export default App;
