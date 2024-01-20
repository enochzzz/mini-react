import React from "../core/React.js";


let countBar = 1
function Bar() {
  console.log("Bar")
  const update = React.update()
  function handleClick() {
    countBar++
    update()
  }
  return (
    <div>
      countBar: {countBar}
      <button onClick={handleClick}>BarClick</button>
    </div>
  )
}
let countFoo = 1
function Foo() {
  console.log("Foo")
  const update = React.update()
  function handleClick() {
    countFoo++
    update()
  }
  return (
    <div>
      countFoo: {countFoo}
      <button onClick={handleClick}>FooClick</button>
    </div>
  )
}

let currentRoot = 1
function App() {
  console.log("App")
  const update = React.update()
  function handleClick() {
    currentRoot++
    update()
  }
  return (
    <div>
      currentRoot: {currentRoot}
      <button onClick={handleClick}>FooClick</button>
      <Foo></Foo>
      <Bar></Bar>
    </div>
  )
}

export default App;
