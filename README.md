#	Popup.js

基于 [W3C HTML5 Dialog API](http://www.w3.org/TR/2013/CR-html5-20130806/interactive-elements.html#the-dialog-element) 的弹出层基础类。

它不提供 UI，但可以通过填充模板构建对读屏器友好访问的对话框、菜单、Tips 等弹出层。

##	特性

1. 基于 HTML5 Dialog API
2. 提供 12 种按元素对齐方式或页面居中显示
3. 统一管理 zIndex
4. 不干扰读屏器操作页面
5. 支持普通与模态浮层
6. 支持 ARIA 标准
7. 兼容 IE6 与所有主流浏览器

##	演示

###	简单使用

*	[创建一个简单的 dialog](http://aui.github.io/popupjs/test/dialog.html)
*	[创建一个简单的下拉菜单](http://aui.github.io/popupjs/test/menu.html)
*	[创建一个带箭头的气泡浮层](http://aui.github.io/popupjs/test/bubble.html)

###	控件封装

*	[下拉组件（selectbox）](http://aui.github.io/popupjs/doc/selectbox.html)
*	[对话框（artDialog）](http://aui.github.io/artDialog/doc/index.html)

##	兼容性

IE6~IE11、Chrome、Firefox、Safari、Opera

##	授权协议

[LGPL](http://www.gnu.org/licenses/lgpl-2.1.html)