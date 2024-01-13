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
  // 创建dom
  const dom = el.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(el.type);

  // 设置props
  Object.keys(el.props).forEach(key => {
    if(key !== "children") {
      dom[key] = el.props[key];
    }
  })
  const children = el.props.children || [];
  children.forEach(child => render(child, dom));

  // 插入父节点
  container.appendChild(dom);
}

const React = {
  createElement,
  render
}

export default React;
