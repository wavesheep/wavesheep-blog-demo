---
title: "JS迷惑知识笔记"
subtitle: "Confusing JS note"
background: "/img/js.webp"
author: "wavesheep"
date: "2019-8-6 12:00:00"
tags:
- "笔记"
- "js"
---
# JS 迷惑知识笔记

> JS是一门历史悠久的语言，悠久的历史使其留下许多令人迷惑的知识。我这篇文章就来盘点那些曾让我迷惑过知识点。
>
> 这篇文章很大程度上是供我自己阅读的，所以很多描述并不是很详细，如果感到迷惑需要自行查阅相关资料。

## ’use strict'

‘use strict’ 即启用严格模式。这是一个经常出现在我们面前的名词，但由于我们从其它编程语言获得而来的编程素养使得我们并不会轻易地写出严格模式禁用的语法，因而导致了我们对这个严格模式的不求甚解。下面我就从严格模式[最新的标准](http://www.ecma-international.org/ecma-262/6.0/#sec-strict-mode-of-ecmascript)和MDN的一些描述来盘点严格模式的有一些知识点。

具体有

- 只要函数参数使用了默认值、解构赋值、或者扩展运算符，那么函数内部就不能显式设定为严格模式，否则会报错 。 这样规定的原因是，函数内部的严格模式，同时适用于函数体和函数参数。但是，函数执行的时候，先执行函数参数，然后再执行函数体。这样就有一个不合理的地方，只有从函数体之中，才能知道参数是否应该以严格模式执行，但是参数却应该先于函数体执行。 
- 禁用八进制语法`:var n = 023和var s = "\047"`，但是ES6的`0o23`可以使用
- 禁用`with`语句
- 禁用`delete`删除一个变量名或者删除一个不可配置(`configurable: false`)的属性
- `arguments`不再反映参数的变化，并且不能对其赋值
- 禁用`eval`或`arguments`作为变量名或函数名
- `eval`拥有自己的作用域，不再影响外部
- 禁用`<函数名>.caller`、`<函数名>.arguments`、`arguments.callee`
- 禁用未来保留字:`implements`, `interface`, `let`, `package`, `private`, `protected`, `public`, `static`,和`yield`作为变量名或函数名。注：这是ES5为ES6准备的保留字，ES6标准的实际保留字现在也不能使用
- `null`或`undefined`作为`this`时不会被转换为 `global object`
- 基本类型作为`this`时不会被转换为包裹类型( wrapper object )。注：可通过`apply`，`call`，`bind`绑定`this`
- 对未定义的变量赋值形式不再会隐式创建全局变量，这将产生 **ReferenceError** 
- 在基本类型上添加属性会报错：`'str'.str = 'str'`
- 在语句块中使用函数声明: `if(a<b){ function f(){} } `
- 对象字面量中使用两个相同的属性名:`{a: 1, b: 3, a: 7}`
- 函数形参中使用两个相同的参数名:`function f(a, b, b){}`

## this

JS的`this`相比于其它语言，如`JAVA`又很大的不同。在`JAVA`中`this`是*引用当前对象的引用变量*, 而在JS中则是一个*隐式上下文对象*。

`this`在运行时进行绑定，反映了运行时的上下文对象。

它具有以下五条绑定规则

1. 默认绑定

   默认绑定是指无法应用其它绑定规则的绑定方式，它默认将`this`绑定到全局对象(global object)上，在严格模式下为`undefined`

2. 隐式绑定

   隐式绑定是函数作为某个对象的属性调用的绑定方式，若有多层对象属性引用则应用最后一层的对象。隐式绑定可因赋值给其它变量而丢失绑定。

   ```js
   function foo() {
   	console.log( this.a );
   }
   
   var obj = {
   	a: 1,
   	foo: foo
   };
   
   var obj2 = {
       obj: obj
       a: 2
   }
   
   // 隐式绑定
   obj.foo(); // 1
   
   // 应用调用链最后一层对象
   obj2.obj.foo(); // 1
   
   // 绑定丢失
   var bar = obj.foo();
   bar() // undefined
   function f(fn){
       fn()
   }
   f(obj.foo) // undefined
   // 这里调用位置是foo()
   (obj2.foo = obj.foo)() // undefined
   
   ```

   

3. 显式绑定

   显式绑定是使用`call`, `apply`, `bind`函数指定上下文的绑定方式

4. new绑定

   new绑定是使用`new`操作符新建对象时的绑定方式。此时`this`指向被新建的对象

5. =>箭头函数绑定

   =>箭头函数绑定是根据函数外层作用域的`this`指定函数内部的`this`的绑定方式。

优先级：按上述规则顺序依次递增

注：如想了解更详细的解释可以查看[你不知道的JavaScript](https://github.com/getify/You-Dont-Know-JS/blob/1ed-zh-CN/this%26objectprototypes/ch2.md)

## 原型

prototype是JS一个重要的知识点，也是新手很容易犯迷糊的知识点。下面是摘录自这方面的优秀博文[帮你彻底搞懂JS中的prototype、__proto__与constructor（图解）](https://blog.csdn.net/cc18868876837/article/details/81211729)的一些核心内容。

1.  ①`__proto__`和`constructor`属性是**对象**所独有的；② `prototype`属性是**函数**所独有的，因为函数也是一种对象，所以函数也拥有`__proto__`和`constructor`属性 
2. __proto__属性的作用就是当访问一个对象的属性时，如果该对象内部不存在这个属性，那么就会去它的__proto__属性所指向的那个对象（父对象）里找，一直找，直到__proto__属性的终点null，再往上找就相当于在null上取值，会报错。通过__proto__属性将对象连接起来的这条链路即我们所谓的原型链。
3.  `prototype`属性的**作用**就是让该函数所实例化的对象们都可以找到公用的属性和方法，即`f1.__proto__ === Foo.prototype` 
4. `constructor`属性的含义就是**指向该对象的构造函数**，所有函数（此时看成对象了）最终的构造函数都指向**Function** 

![prototype图解](/img/prototype图解.webp)

## 类型转换

JS的类型在一定条件下发生自动转化，这可能是JS最让人难以理解的东西了。解释它需要花费很多篇幅, 下面我放一些有用的传送门

1. [你不知道的JavaScript 类型与语法](https://github.com/getify/You-Dont-Know-JS/tree/1ed-zh-CN/types%26gammar)
2. [类型转换规范](http://www.ecma-international.org/ecma-262/#sec-type-conversion)
3. [== 比较规则规范](http://www.ecma-international.org/ecma-262/#sec-abstract-equality-comparison)

## 事件循环

JS的运行模型若去除worker是一个单线程模型。为了在这样的一个单线程模型中运行异步任务，JS应用了事件循环机制。它有以下几个特点。

1. 将任务分为宏任务和微任务应用不同的队列，微任务循环在每次宏任务结束后下一个宏任务开始前之间执行
2. 将初始全部代码放入初始宏任务事件循环
3. 遇到setTimeout等非Promise异步操作放入下一个宏任务事件循环，并在每次新的宏任务开始时检查是否应该执行，若时间没到则加入下一个宏任务事件循环，反之则直接执行
4. 遇到Promise则直接执行主体代码，将then，catch等代码加入下一次微任务循环