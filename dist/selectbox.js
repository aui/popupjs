/*! popupjs v1.0.0 | https://github.com/aui/popupjs */
!(function () {

var __modules__ = {};

function require (id) {
    var mod = __modules__[id];
    var exports = 'exports';

    if (typeof mod === 'object') {
        return mod;
    }

    if (!mod[exports]) {
        mod[exports] = {};
        mod[exports] = mod.call(mod[exports], require, mod[exports], mod) || mod[exports];
    }

    return mod[exports];
}

function define (path, fn) {
    __modules__[path] = fn;
}



define("jquery", function () {
	return jQuery;
});


/*!
 * PopupJS
 * Date: 2014-11-09
 * https://github.com/aui/popupjs
 * (c) 2009-2014 TangBin, http://www.planeArt.cn
 *
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://www.gnu.org/licenses/lgpl-2.1.html
 */

define("popup", function (require) {

var $ = require("jquery");

var _count = 0;
var _isIE6 = !('minWidth' in $('html')[0].style);
var _isFixed = !_isIE6;


function Popup () {

    this.destroyed = false;


    this.__popup = $('<div />')
    /*使用 <dialog /> 元素可能导致 z-index 永远置顶的问题(chrome)*/
    .css({
        display: 'none',
        position: 'absolute',
        /*
        left: 0,
        top: 0,
        bottom: 'auto',
        right: 'auto',
        margin: 0,
        padding: 0,
        border: '0 none',
        background: 'transparent'
        */
        outline: 0
    })
    .attr('tabindex', '-1')
    .html(this.innerHTML)
    .appendTo('body');


    this.__backdrop = this.__mask = $('<div />')
    .css({
        opacity: .7,
        background: '#000'
    });


    // 使用 HTMLElement 作为外部接口使用，而不是 jquery 对象
    // 统一的接口利于未来 Popup 移植到其他 DOM 库中
    this.node = this.__popup[0];
    this.backdrop = this.__backdrop[0];

    _count ++;
}


$.extend(Popup.prototype, {
    
    /**
     * 初始化完毕事件，在 show()、showModal() 执行
     * @name Popup.prototype.onshow
     * @event
     */

    /**
     * 关闭事件，在 close() 执行
     * @name Popup.prototype.onclose
     * @event
     */

    /**
     * 销毁前事件，在 remove() 前执行
     * @name Popup.prototype.onbeforeremove
     * @event
     */

    /**
     * 销毁事件，在 remove() 执行
     * @name Popup.prototype.onremove
     * @event
     */

    /**
     * 重置事件，在 reset() 执行
     * @name Popup.prototype.onreset
     * @event
     */

    /**
     * 焦点事件，在 foucs() 执行
     * @name Popup.prototype.onfocus
     * @event
     */

    /**
     * 失焦事件，在 blur() 执行
     * @name Popup.prototype.onblur
     * @event
     */

    /** 浮层 DOM 素节点[*] */
    node: null,

    /** 遮罩 DOM 节点[*] */
    backdrop: null,

    /** 是否开启固定定位[*] */
    fixed: false,

    /** 判断对话框是否删除[*] */
    destroyed: true,

    /** 判断对话框是否显示 */
    open: false,

    /** close 返回值 */
    returnValue: '',

    /** 是否自动聚焦 */
    autofocus: true,

    /** 对齐方式[*] */
    align: 'bottom left',

    /** 内部的 HTML 字符串 */
    innerHTML: '',

    /** CSS 类名 */
    className: 'ui-popup',

    /**
     * 显示浮层
     * @param   {HTMLElement, Event}  指定位置（可选）
     */
    show: function (anchor) {

        if (this.destroyed) {
            return this;
        }

        var that = this;
        var popup = this.__popup;
        var backdrop = this.__backdrop;

        this.__activeElement = this.__getActive();

        this.open = true;
        this.follow = anchor || this.follow;


        // 初始化 show 方法
        if (!this.__ready) {

            popup
            .addClass(this.className)
            .attr('role', this.modal ? 'alertdialog' : 'dialog')
            .css('position', this.fixed ? 'fixed' : 'absolute');

            if (!_isIE6) {
                $(window).on('resize', $.proxy(this.reset, this));
            }

            // 模态浮层的遮罩
            if (this.modal) {
                var backdropCss = {
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    userSelect: 'none',
                    zIndex: this.zIndex || Popup.zIndex
                };


                popup.addClass(this.className + '-modal');


                if (!_isFixed) {
                    $.extend(backdropCss, {
                        position: 'absolute',
                        width: $(window).width() + 'px',
                        height: $(document).height() + 'px'
                    });
                }


                backdrop
                .css(backdropCss)
                .attr({tabindex: '0'})
                .on('focus', $.proxy(this.focus, this));

                // 锁定 tab 的焦点操作
                this.__mask = backdrop
                .clone(true)
                .attr('style', '')
                .insertAfter(popup);

                backdrop
                .addClass(this.className + '-backdrop')
                .insertBefore(popup);

                this.__ready = true;
            }


            if (!popup.html()) {
                popup.html(this.innerHTML);
            }
        }


        popup
        .addClass(this.className + '-show')
        .show();

        backdrop.show();


        this.reset().focus();
        this.__dispatchEvent('show');

        return this;
    },


    /** 显示模态浮层。参数参见 show() */
    showModal: function () {
        this.modal = true;
        return this.show.apply(this, arguments);
    },
    
    
    /** 关闭浮层 */
    close: function (result) {
        
        if (!this.destroyed && this.open) {
            
            if (result !== undefined) {
                this.returnValue = result;
            }
            
            this.__popup.hide().removeClass(this.className + '-show');
            this.__backdrop.hide();
            this.open = false;
            this.blur();// 恢复焦点，照顾键盘操作的用户
            this.__dispatchEvent('close');
        }
    
        return this;
    },


    /** 销毁浮层 */
    remove: function () {

        if (this.destroyed) {
            return this;
        }

        this.__dispatchEvent('beforeremove');
        
        if (Popup.current === this) {
            Popup.current = null;
        }


        // 从 DOM 中移除节点
        this.__popup.remove();
        this.__backdrop.remove();
        this.__mask.remove();


        if (!_isIE6) {
            $(window).off('resize', this.reset);
        }


        this.__dispatchEvent('remove');

        for (var i in this) {
            delete this[i];
        }

        return this;
    },


    /** 重置位置 */
    reset: function () {

        var elem = this.follow;

        if (elem) {
            this.__follow(elem);
        } else {
            this.__center();
        }

        this.__dispatchEvent('reset');

        return this;
    },


    /** 让浮层获取焦点 */
    focus: function () {

        var node = this.node;
        var popup = this.__popup;
        var current = Popup.current;
        var index = this.zIndex = Popup.zIndex ++;

        if (current && current !== this) {
            current.blur(false);
        }

        // 检查焦点是否在浮层里面
        if (!$.contains(node, this.__getActive())) {
            var autofocus = popup.find('[autofocus]')[0];

            if (!this._autofocus && autofocus) {
                this._autofocus = true;
            } else {
                autofocus = node;
            }

            this.__focus(autofocus);
        }

        // 设置叠加高度
        popup.css('zIndex', index);
        //this.__backdrop.css('zIndex', index);

        Popup.current = this;
        popup.addClass(this.className + '-focus');

        this.__dispatchEvent('focus');

        return this;
    },


    /** 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户 */
    blur: function () {

        var activeElement = this.__activeElement;
        var isBlur = arguments[0];


        if (isBlur !== false) {
            this.__focus(activeElement);
        }

        this._autofocus = false;
        this.__popup.removeClass(this.className + '-focus');
        this.__dispatchEvent('blur');

        return this;
    },


    /**
     * 添加事件
     * @param   {String}    事件类型
     * @param   {Function}  监听函数
     */
    addEventListener: function (type, callback) {
        this.__getEventListener(type).push(callback);
        return this;
    },


    /**
     * 删除事件
     * @param   {String}    事件类型
     * @param   {Function}  监听函数
     */
    removeEventListener: function (type, callback) {
        var listeners = this.__getEventListener(type);
        for (var i = 0; i < listeners.length; i ++) {
            if (callback === listeners[i]) {
                listeners.splice(i--, 1);
            }
        }
        return this;
    },


    // 获取事件缓存
    __getEventListener: function (type) {
        var listener = this.__listener;
        if (!listener) {
            listener = this.__listener = {};
        }
        if (!listener[type]) {
            listener[type] = [];
        }
        return listener[type];
    },


    // 派发事件
    __dispatchEvent: function (type) {
        var listeners = this.__getEventListener(type);

        if (this['on' + type]) {
            this['on' + type]();
        }

        for (var i = 0; i < listeners.length; i ++) {
            listeners[i].call(this);
        }
    },


    // 对元素安全聚焦
    __focus: function (elem) {
        // 防止 iframe 跨域无权限报错
        // 防止 IE 不可见元素报错
        try {
            // ie11 bug: iframe 页面点击会跳到顶部
            if (this.autofocus && !/^iframe$/i.test(elem.nodeName)) {
                elem.focus();
            }
        } catch (e) {}
    },


    // 获取当前焦点的元素
    __getActive: function () {
        try {// try: ie8~9, iframe #26
            var activeElement = document.activeElement;
            var contentDocument = activeElement.contentDocument;
            var elem = contentDocument && contentDocument.activeElement || activeElement;
            return elem;
        } catch (e) {}
    },


    // 居中浮层
    __center: function () {
    
        var popup = this.__popup;
        var $window = $(window);
        var $document = $(document);
        var fixed = this.fixed;
        var dl = fixed ? 0 : $document.scrollLeft();
        var dt = fixed ? 0 : $document.scrollTop();
        var ww = $window.width();
        var wh = $window.height();
        var ow = popup.width();
        var oh = popup.height();
        var left = (ww - ow) / 2 + dl;
        var top = (wh - oh) * 382 / 1000 + dt;// 黄金比例
        var style = popup[0].style;

        
        style.left = Math.max(parseInt(left), dl) + 'px';
        style.top = Math.max(parseInt(top), dt) + 'px';
    },
    
    
    // 指定位置 @param    {HTMLElement, Event}  anchor
    __follow: function (anchor) {
        
        var $elem = anchor.parentNode && $(anchor);
        var popup = this.__popup;
        

        if (this.__followSkin) {
            popup.removeClass(this.__followSkin);
        }


        // 隐藏元素不可用
        if ($elem) {
            var o = $elem.offset();
            if (o.left * o.top < 0) {
                return this.__center();
            }
        }
        
        var that = this;
        var fixed = this.fixed;

        var $window = $(window);
        var $document = $(document);
        var winWidth = $window.width();
        var winHeight = $window.height();
        var docLeft =  $document.scrollLeft();
        var docTop = $document.scrollTop();


        var popupWidth = popup.width();
        var popupHeight = popup.height();
        var width = $elem ? $elem.outerWidth() : 0;
        var height = $elem ? $elem.outerHeight() : 0;
        var offset = this.__offset(anchor);
        var x = offset.left;
        var y = offset.top;
        var left =  fixed ? x - docLeft : x;
        var top = fixed ? y - docTop : y;


        var minLeft = fixed ? 0 : docLeft;
        var minTop = fixed ? 0 : docTop;
        var maxLeft = minLeft + winWidth - popupWidth;
        var maxTop = minTop + winHeight - popupHeight;


        var css = {};
        var align = this.align.split(' ');
        var className = this.className + '-';
        var reverse = {top: 'bottom', bottom: 'top', left: 'right', right: 'left'};
        var name = {top: 'top', bottom: 'top', left: 'left', right: 'left'};


        var temp = [{
            top: top - popupHeight,
            bottom: top + height,
            left: left - popupWidth,
            right: left + width
        }, {
            top: top,
            bottom: top - popupHeight + height,
            left: left,
            right: left - popupWidth + width
        }];


        var center = {
            left: left + width / 2 - popupWidth / 2,
            top: top + height / 2 - popupHeight / 2
        };

        
        var range = {
            left: [minLeft, maxLeft],
            top: [minTop, maxTop]
        };


        // 超出可视区域重新适应位置
        $.each(align, function (i, val) {

            // 超出右或下边界：使用左或者上边对齐
            if (temp[i][val] > range[name[val]][1]) {
                val = align[i] = reverse[val];
            }

            // 超出左或右边界：使用右或者下边对齐
            if (temp[i][val] < range[name[val]][0]) {
                align[i] = reverse[val];
            }

        });


        // 一个参数的情况
        if (!align[1]) {
            name[align[1]] = name[align[0]] === 'left' ? 'top' : 'left';
            temp[1][align[1]] = center[name[align[1]]];
        }


        //添加follow的css, 为了给css使用
        className += align.join('-') + ' '+ this.className+ '-follow';
        
        that.__followSkin = className;


        if ($elem) {
            popup.addClass(className);
        }

        
        css[name[align[0]]] = parseInt(temp[0][align[0]]);
        css[name[align[1]]] = parseInt(temp[1][align[1]]);
        popup.css(css);

    },


    // 获取元素相对于页面的位置（包括iframe内的元素）
    // 暂时不支持两层以上的 iframe 套嵌
    __offset: function (anchor) {

        var isNode = anchor.parentNode;
        var offset = isNode ? $(anchor).offset() : {
            left: anchor.pageX,
            top: anchor.pageY
        };


        anchor = isNode ? anchor : anchor.target;
        var ownerDocument = anchor.ownerDocument;
        var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;
        
        if (defaultView == window) {// IE <= 8 只能使用两个等于号
            return offset;
        }

        // {Element: Ifarme}
        var frameElement = defaultView.frameElement;
        var $ownerDocument = $(ownerDocument);
        var docLeft =  $ownerDocument.scrollLeft();
        var docTop = $ownerDocument.scrollTop();
        var frameOffset = $(frameElement).offset();
        var frameLeft = frameOffset.left;
        var frameTop = frameOffset.top;
        
        return {
            left: offset.left + frameLeft - docLeft,
            top: offset.top + frameTop - docTop
        };
    }
    
});


/** 当前叠加高度 */
Popup.zIndex = 1024;


/** 顶层浮层的实例 */
Popup.current = null;


return Popup;

});

/*!
 * selectbox
 * Date: 2014-01-10
 * https://github.com/aui/popupjs
 * (c) 2009-2013 TangBin, http://www.planeArt.cn
 *
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://www.gnu.org/licenses/lgpl-2.1.html
 */
define("selectbox", function (require) {

var $ = require("jquery");
var Popup = require("popup");
var css = '../css/ui-selectbox.css';


// css loader: RequireJS & SeaJS
if (css) {
    var fn = require[require.toUrl ? 'toUrl' : 'resolve'];
    if (fn) {
        css = fn(css);
        css = '<link rel="stylesheet" href="' + css + '" />';
        if ($('base')[0]) {
            $('base').before(css);
        } else {
            $('head').append(css);
        } 
    }
}


function Selectbox (select, options) {

    select = this.select = $(select);

    $.extend(this, options || {});

    var that = this;
    var isIE6 = !('minWidth' in select[0].style);
    //var selectHeight = select.outerHeight() + 'px';

    

    if (select.is('[multiple]')) {
        return;
    }


    if (select.data('selectbox')) {
        // 删除上一次的 selectbox 以重新更新
        select.data('selectbox').remove();
    }


    var selectboxHtml = this._tpl(this.selectboxHtml, $.extend({
        textContent: that._getOption().html() || ''
    }, select.data()));


    this._selectbox = $(selectboxHtml);
    this._value = this._selectbox.find('[data-value]');


    // selectbox 的事件绑定
    if (this.isShowDropdown && !select.attr('disabled')) {
        this._globalKeydown = $.proxy(this._globalKeydown, this);

        this._selectbox
        .on(this._clickType + ' focus blur', function (event) {
            that[that._clickType === event.type ? 'click' : event.type]();
        });
    }


    this._selectbox
    .css({
        width: select.outerWidth() + 'px'
    });
    

    // 克隆原生 select 高度
    // this._value.css({
    //     minHeight: selectHeight,
    //     height: isIE6 ? selectHeight : '',
    //     lineHeight: selectHeight
    // });


    // 克隆原生 select 的基本 UI 事件
    select
    .on('focus blur', function (event) {
        that[event.type]();
        event.preventDefault();
    })
    .on('change', function () {
        var text = that._getOption().html();
        that._value.html(text);
    });


    // 隐藏原生 select
    // 盲人仍然可以通过 tab 键访问到原生控件
    // iPad 与 iPhone 等设备点击仍然能够使用滚动操作 select
    select.css({
        opacity: 0,
        position: 'absolute',
        left: isIE6 ? '-9999px' : 'auto',
        right: 'auto',
        top: 'auto',
        bottom: 'auto',
        zIndex: this.isShowDropdown ? -1 : 1
    }).data('selectbox', this);

    // 代替原生 select
    select.after(this._selectbox);
}

var popup = function () {};
popup.prototype = Popup.prototype;
Selectbox.prototype = new popup();

$.extend(Selectbox.prototype, {

    selectboxHtml:
      '<div class="ui-selectbox" hidefocus="true" style="user-select:none" onselectstart="return false" tabindex="-1" aria-hidden>'
    +     '<div class="ui-selectbox-inner" data-value="">{{textContent}}</div>'
    +     '<i class="ui-selectbox-icon"></i>'
    + '</div>',
    
    dropdownHtml:  '<dl class="ui-selectbox-dropdown">{{options}}</dl>',
    optgroupHtml:  '<dt class="ui-selectbox-optgroup">{{label}}</dt>',
    optionHtml:    '<dd class="ui-selectbox-option {{className}}" data-option="{{index}}" tabindex="-1">{{textContent}}</dd>',
    selectedClass: 'ui-selectbox-selected',
    disabledClass: 'ui-selectbox-disabled',
    focusClass:    'ui-selectbox-focus',
    openClass:     'ui-selectbox-open',

    // 移动端不使用模拟下拉层
    isShowDropdown:  !('createTouch' in document),

    selectedIndex: 0,
    value: '',


    close: function () {
        if (this._popup) {
            this._popup.close().remove();
            this.change();
        }
    },


    show: function () {

        var that = this;
        var select = this.select;
        var selectbox = that._selectbox;

        if (!select[0].length) {
            return false;
        }

        var MARGIN = 20;
        var selectHeight = select.outerHeight();
        var topHeight = select.offset().top - $(document).scrollTop();
        var bottomHeight = $(window).height() - topHeight - selectHeight;
        var maxHeight = Math.max(topHeight, bottomHeight) - MARGIN;

        var popup = this._popup = new Popup();
        popup.node.innerHTML = this._dropdownHtml();

        this._dropdown = $(popup.node);
        $(popup.backdrop)
        .css('opacity', 0)
        .on(this._clickType, $.proxy(this.close, this));


        var children = that._dropdown.children();
        var isIE6 = !('minWidth' in children[0].style);


        children.css({
            minWidth: selectbox.innerWidth(),
            maxHeight: maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden'
        });



        this._dropdown
        .on(this._clickType, '[data-option]', function (event) {
            var index = $(this).data('option');
            that.selected(index);
            that.close();

            event.preventDefault();
        });


        popup.onshow = function () {
            $(document).on('keydown', that._globalKeydown);
            selectbox.addClass(that.openClass);
            //selectbox.find('[data-option=' +  + ']').focus()
            that.selectedIndex = select[0].selectedIndex;
            that.selected(that.selectedIndex);
        };


        popup.onremove = function () {
            $(document).off('keydown', that._globalKeydown);
            selectbox.removeClass(that.openClass);
        };


        // 记录展开前的 value
        this._oldValue = this.select.val();

        popup.showModal(selectbox[0]);

        if (isIE6) {
            children.css({
                width: Math.max(selectbox.innerWidth(), children.outerWidth()),
                height: Math.min(maxHeight, children.outerHeight())
            });
            
            popup.reset();
        }
    },


    selected: function (index) {

        // 检查当前项是否被禁用
        if (this._getOption(index).attr('disabled')) {
            return false;
        }

        var dropdown = this._dropdown;
        var option = this._dropdown.find('[data-option=' + index + ']');
        var value = this.select[0].options[index].value;
        var oldIndex = this.select[0].selectedIndex;
        var selectedClass = this.selectedClass;

        // 更新选中状态样式
        dropdown.find('[data-option=' + oldIndex + ']').removeClass(selectedClass);
        option.addClass(selectedClass);
        option.focus();

        // 更新模拟控件的显示值
        this._value.html(this._getOption(index).html());

        // 更新 Selectbox 对象属性
        this.value = value;
        this.selectedIndex = index;

        // 同步数据到原生 select
        this.select[0].selectedIndex = this.selectedIndex;
        this.select[0].value = this.value;

        return true;
    },


    change: function () {
        if (this._oldValue !== this.value) {
            this.select.triggerHandler('change');
        }
    },


    click: function () {
        this.select.focus();
        if (this._popup && this._popup.open) {
            this.close();
        } else {
            this.show();
        }
    },


    focus: function () {
        this._selectbox.addClass(this.focusClass);
    },


    blur: function () {
        this._selectbox.removeClass(this.focusClass);
    },


    remove: function () {
        this.close();
        this._selectbox.remove();
    },


    _clickType: 'onmousedown' in document ? 'mousedown' : 'touchstart',


    // 获取原生 select 的 option jquery 对象
    _getOption: function (index) {
        index = index === undefined ? this.select[0].selectedIndex : index;
        return this.select.find('option').eq(index);
    },


    // 简单模板替换
    _tpl: function (tpl, data) {
        return tpl.replace(/{{(.*?)}}/g, function ($1, $2) {
            return data[$2];
        });
    },


    // 获取下拉框的 HTML
    _dropdownHtml: function () {
        var options = '';
        var that = this;
        var select = this.select;
        var selectData = select.data();
        var index = 0;


        var getOptionsData = function ($options) {
            $options.each(function () {
                var $this = $(this);
                var className = '';

                if (this.selected) {
                    className = that.selectedClass;
                } else {
                    className = this.disabled ? that.disabledClass : '';
                }

                options += that._tpl(that.optionHtml, $.extend({
                        value: $this.val(),
                        // 如果内容类似： "&#60;s&#62;选项&#60;/s&#62;" 使用 .text() 会导致 XSS
                        // 另外，原生 option 不支持 html 文本
                        textContent: $this.html(),
                        index: index,
                        className: className
                    }, $this.data(), selectData));

                index ++;
            });
        };


        if (select.find('optgroup').length) {

            select.find('optgroup').each(function (index) {
                options += that._tpl(that.optgroupHtml, $.extend({
                    index: index,
                    label: this.label
                }, $(this).data(), selectData));
                getOptionsData($(this).find('option'));
            });

        } else {
            getOptionsData(select.find('option'));
        }


        return this._tpl(this.dropdownHtml, {
            options: options
        });
    },


    // 上下移动
    _move: function (n) {
        var min = 0;
        var max = this.select[0].length - 1;
        var index = this.select[0].selectedIndex + n;
        
        if (index >= min && index <= max) {
            // 跳过带有 disabled 属性的选项
            if (!this.selected(index)) {
                this._move(n + n);
            }
        }
    },


    // 全局键盘监听
    _globalKeydown: function (event) {

        var p;

        switch (event.keyCode) {
            // backspace
            case 8:
                p = true;
                break;

            // tab
            case 9:
            // esc
            case 27:
            // enter
            case 13:
                this.close();
                p = true;
                break;

            // up
            case 38:

                this._move(-1);
                p = true;
                break;

            // down
            case 40:

                this._move(1);
                p = true;
                break;
        }

        if (p){
            event.preventDefault();
        }
    }

});


return function (elem, options) {
    // 注意：不要返回 Selectbox 更多接口给外部，只保持装饰用途
    // 保证模拟的下拉是原生控件的子集，这样可以随时在项目中撤销装饰

    if (elem.type === 'select') {
        new Selectbox(elem, options);
    } else {
        $(elem).each(function () {
            new Selectbox(this, options);
        });
    }
};

});

window.selectbox = require("selectbox");

})();