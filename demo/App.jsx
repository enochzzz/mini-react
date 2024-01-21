import React from "../core/React.js";


let countFoo = 1
function Foo() {
  console.log("Foo")
  const [count, setCount] = React.useState(10)
  const [count2, setCount2] = React.useState(15)
  function handleClick() {
    console.log("handleClick")
    setCount((c) => c + 1)
    setCount2((c) => c + 2)
  }
  return (
    <div>
      countFoo: {count}
      count2Foo: {count2}
      <button onClick={handleClick}>FooClick</button>
    </div>
  )
}

function App() {
  console.log("App")

  return (
    <div>
      <Foo></Foo>
    </div>
  )
}

export default App;
