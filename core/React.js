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
      children: children.map(child => {
        const isTextNode = typeof child === 'string' || typeof child === 'number';
        return isTextNode
          ? createTextNode(child)
          : child
      }
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
let wipFiber = null
let currentRoot = null
let nextWorkOfUnit = null
let deletions = []
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    // 执行任务
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)

    // 更新的结束位置
    if(wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      nextWorkOfUnit = null
    }
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
  deletions.forEach(commitDeletions)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
  deletions = []
}

function commitDeletions(fiber) {
  // 如果不是function component这么处理就行。fc需要考虑找不到child或者parent时需要向上或者向下的问题
  // fiber.parent.dom.removeChild(fiber.dom)

  if (fiber.dom) {
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent
    }
    fiberParent.dom.removeChild(fiber.dom)
  } else {
    //fc需要考虑找不到child或者parent时需要向上或者向下的问题
    commitDeletions(fiber.child)
  }
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
      if (nextProps[key] !== prevProps[key]) {
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
      if (child) {
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

      // 如果有oldFiber，且isSameType为false，那么创建新节点，且需要统一收集需要删除的节点
      if (oldFiber) {
        deletions.push(oldFiber)
      }
    }

    //遍历的下一轮是child的sibing，所以需要在遍历中也更新oldFiber节点
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0 || !prevChild) {
      fiber.child = newFiber
    } else {
      prevChild && (prevChild.sibling = newFiber)
    }

    if (newFiber) {
      prevChild = newFiber
    }
  });

  while (oldFiber) {
    deletions.push(oldFiber)
    oldFiber = oldFiber.sibling
  }
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber
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

  //3. 转换链表，设置指针
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

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
  let currentFiber = wipFiber
  return () => {
    wipRoot = {
      ...currentFiber,
      // 指向老的节点
      alternate: currentFiber,
    }
    nextWorkOfUnit = wipRoot
  }
}

const React = {
  createElement,
  render,
  update
}

export default React;
