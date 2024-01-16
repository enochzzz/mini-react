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
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el]
    }
  }
  root = nextWorkOfUnit
}

let root = null
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
  if (!nextWorkOfUnit && root) {
    commitRoot()
  }

  requestIdleCallback(workLoop);
}

function commitRoot() {
  commitWork(root.child)
}

function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }
  if (fiber.dom) {
    fiberParent.dom.appendChild(fiber.dom);
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type)
}

function updateProps(dom, props) {
  Object.keys(props).forEach(key => {
    if (key !== "children") {
      dom[key] = props[key];
    }
  })
}

function initChildren(fiber, children) {
  let prevChild = null
  children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      props: child.props,
      child: null,
      parent: fiber,
      sibling: null,
      dom: null
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
  initChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    //1. 创建dom
    const dom = fiber.dom = createDom(fiber.type);

    //2. 处理props
    updateProps(dom, fiber.props)
  }

  //3. 转换链表，设置指针
  const children = fiber.props.children;
  initChildren(fiber, children)
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
  initChildren(fiber, children)

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

const React = {
  createElement,
  render
}

export default React;
