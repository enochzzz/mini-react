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
}

let nextWorkOfUnit = null
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    // 执行任务
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    // 判断是否需要让出时间片
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
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

function initChildren(fiber) {
  const children = fiber.props.children || [];
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

function performWorkOfUnit(fiber) {
  if (!fiber.dom) {
    //1. 创建dom
    const dom = fiber.dom = createDom(fiber.type);

    //2. 处理props
    updateProps(dom, fiber.props)

    fiber.parent?.dom.appendChild(dom)
  }

  //3. 转换链表，设置指针
  initChildren(fiber)

  //4. 返回下一个要执行的任务
  if (fiber.child) {
    return fiber.child
  }
  if (fiber.sibling) {
    return fiber.sibling
  }
  return fiber.parent?.sibling
}

requestIdleCallback(workLoop);

const React = {
  createElement,
  render
}

export default React;
