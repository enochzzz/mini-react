function createTextNode(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function createElement(type, props, ...children) {
  console.log('createElement----------------', type, props, children)
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object'
          ? child
          : createTextNode(child)
      )
    }
  }
}

function render(el, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [el]
    }
  }
  nextWorkOfUnit = wipRoot
}

let wipRoot = null
let currentRoot = null
let nextWorkOfUnit = null
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    // 执行任务
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    // 判断是否需要让出时间片
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 树执行结束，开始统一提交
  if (!nextWorkOfUnit && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop);
}

function commitRoot() {
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }

  if (fiber.effectTag === "updateProps") {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props)
  } else if (fiber.effectTag === "placement") {
    if (fiber.dom) {
      fiberParent.dom.appendChild(fiber.dom);
    }
  }


  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type)
}

function updateProps(dom, nextProps, prevProps) {
  //1. old有，new没有 删除
  Object.keys(prevProps).forEach(key => {
    if (key !== "children") {
      if (!(key in nextProps)) {
        dom.removeAttribute(key)
      }
    }
  })
  //2. new有，old没有 添加
  //3. old new 都有但不相等 更新
  // 2/3两种其实可以看作一种情况，old没有可以视作undefined，不相等
  Object.keys(nextProps).forEach(key => {
    if (key !== "children") {
      if(nextProps[key] !== prevProps[key]) {
        if (key.startsWith('on')) {
          const eventType = key.slice(2).toLowerCase()
          dom.removeEventListener(eventType, prevProps[key])
          dom.addEventListener(eventType, nextProps[key])
        } else {
  
          dom[key] = nextProps[key];
        }
      }
    }
  })
}

function reconcileChildren(fiber, children) {
  // 当前fiber 指向的老节点的 child，方便在遍历中对比。遍历的下一轮是child的sibing，所以需要在遍历中也更新oldFiber节点
  let oldFiber = fiber.alternate?.child
  let prevChild = null
  children.forEach((child, index) => {
    const isSameType = oldFiber && oldFiber.type === child.type
    let newFiber
    if (isSameType) {
      // update
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        // 因为是更新props，不生成新dom，所以服用老的
        dom: oldFiber.dom,
        effectTag: "updateProps",
        // 更新的标识
        alternate: oldFiber
      }
    } else {
      // create
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: null,
        // 新建的标识
        effectTag: "placement"
      }
    }

    //遍历的下一轮是child的sibing，所以需要在遍历中也更新oldFiber节点
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevChild.sibling = newFiber
    }
    prevChild = newFiber
  });
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    //1. 创建dom
    const dom = fiber.dom = createDom(fiber.type);

    //2. 处理props
    updateProps(dom, fiber.props, {})
  }

  //3. 转换链表，设置指针
  const children = fiber.props.children;
  reconcileChildren(fiber, children)
}

function performWorkOfUnit(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  //3. 转换链表，设置指针
  const children = isFunctionComponent ? [fiber.type(fiber.props)] : fiber.props.children;
  reconcileChildren(fiber, children)

  //4. 返回下一个要执行的任务
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.parent
  }
}

requestIdleCallback(workLoop);


function update() {
  // 配合一直循环的调度器生成新的vdom树
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    // 指向老的节点
    alternate: currentRoot,
  }
  nextWorkOfUnit = wipRoot
}

const React = {
  createElement,
  render,
  update
}

export default React;
