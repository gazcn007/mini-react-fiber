import './App.css';
import {useState} from 'react';

const Root = {name: 'App'};
const A = {name: 'A'};
const B = {name: 'B'};
const C1 = {name: 'c1'};
const C2 = {name: 'c2'};
const E = {name: 'E'};
const G = {name: 'G'};

Root.render = () => [A, B];
A.render = () => [C1, C2];
C1.render = () => [E];
C2.render = () => [];
E.render = () => [];
B.render = () => [G];
G.render = () => [];

function sleep(n) {
  const start = +new Date();
  while(true) if(+new Date() - start > n) break;
}

function App() {
  let [nodes, setNodes] = useState([]);

  /**
   * The stack way
   */
  let stack = [];
  function stackWork(o) {
    stack = stack.concat(o.name);
  }

  function stackReconcile(instance) {
      stackWork(instance);
      sleep(1000);
      const children = instance.render();
      children.forEach(stackReconcile);
      setNodes(stack);
  }

  function clickStack (){
    stackReconcile(Root);
  }

  /**
   * The Fiber way
   */

  // Fiber node
  let node, root;
  let done = false;
  class ReactFiber {
    constructor(instance) {
        this.instance = instance;
        this.child = null;
        this.sibling = null;
        this.return = null;
    }
  }

  // link Fiber graph
  function link(parent, children) {
    if (children === null) children = [];

    parent.child = children.reduceRight((previous, current) => {
        const node = new ReactFiber(current);
        node.return = parent;
        node.sibling = previous;
        return node;
    }, null);

    return parent.child;
  }

  // build the Fiber
  function fiberWork(node) {
    stack = stack.concat(node.instance.name);
    const children = node.instance.render();
    setNodes(stack);
    return link(node, children);
  }

  function fiberWalk() {
    // sleep(1000);
    if(done) return;
    let child = fiberWork(node);

    if (child) {
        node = child;
        return;
    }

    if (node === root) {
        return;
    }

    while (!node.sibling) {
        if (!node.return || node.return === root) {
            done = true;
            return;
        }
        node = node.return;
    }

    node = node.sibling;
}

  function clickFiber(){
    const hostNode = new ReactFiber(Root);
    root = hostNode;
    node = root;
    const interval = setInterval(fiberWalk, 1000);
    if(done) clearInterval(interval);
  }

  function reset(){
    setNodes([]);
    stack = [];
  }

  return (
    <div className="App">
      <header className="App-header">
        {
          nodes.map(e => <p>{e}</p>)
        }
        <button onClick={clickStack}>
          Run Stack Reconcilor
        </button>
        <button onClick={clickFiber}>
          Run Fiber Reconcilor
        </button>
        <button onClick={reset}>
          Reset
        </button>
      </header>
    </div>
  );
}

export default App;
