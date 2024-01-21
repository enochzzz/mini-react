import React from "../core/React.js";


let countFoo = 1
function Foo() {
  console.log("Foo")
  const [count, setCount] = React.useState(10)
  function handleClick() {
    console.log("handleClick")
    setCount((c) => c + 1)
  }

  React.useEffect(() => {
    console.log('init')
  }, [])
  React.useEffect(() => {
    console.log('update')
  }, [count])
  return (
    <div>
      countFoo: {count}
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
