var selectbox = (function ($) {

var _count = 0;
var _isIE6 = !('minWidth' in $('html')[0].style);
var _isFixed = !_isIE6;


function Popup () {

	this.destroyed = false;


	this.__popup = $('<div />')
	.attr({
		tabindex: '-1'
	})
	.css({
		display: 'none',
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 'auto',
		right: 'auto',
		margin: 0,
		padding: 0,
		outline: 0,
		border: '0 none',
		background: 'transparent'
	})
	.appendTo('body');


	this.__backdrop = $('<div />');


	// 使用 HTMLElement 作为外部接口使用，而不是 jquery 对象
	// 统一的接口利于未来 Popup 移植到其他 DOM 库中
	this.node = this.__popup[0];
	this.backdrop = this.__backdrop[0];

	_count ++;

	Popup.oncreate(this);
};


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
	 * 关闭事件，在 remove() 执行
	 * @name Popup.prototype.onremove
	 * @event
	 */

	/**
	 * 关闭事件，在 reset() 执行
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

	/** 浮层 DOM 素节点 */
	node: null,

	/** 遮罩 DOM 节点 */
	backdrop: null,

	/** 是否开启固定定位 */
	fixed: false,

	/** 吸附到元素的定位偏移值 */
	offset: 0,

	/** 判断对话框是否删除 */
	destroyed: true,

	/** 判断对话框是否显示 */
	open: false,

	/** close 返回值 */
	returnValue: '',

	/** 是否自动聚焦 */
	autofocus: true,

	/** 设置遮罩背景颜色 */
	backdropBackground: '#000',

	/** 设置遮罩透明度 */
	backdropOpacity: 0.7,

	/**
	 * 显示浮层
	 * @param	{HTMLElement Object, Event Object}	指定位置（可选）
	 */
	show: function (anchor) {

		if (this.destroyed || this.open) {
			return this;
		}

		var that = this;

		this.__activeElement = this.__getActive();

		this.open = true;


		this
		.__popup
		.show()
		.addClass('ui-popup-show')
		.attr('role', this.modal ? 'alertdialog' : 'dialog')
		.css('position', this.fixed ? 'fixed' : 'absolute');

		this.__backdrop.show();


		if (!this.__ready) {

			this.modal && this.__lock();
			
			this.__popup.on('mousedown touchstart', function () {
				that.focus();
			});


			$(window).on('resize', this.__onresize = function () {
				!_isIE6 && that.reset();
			});

			this.__ready = true;
		}

		this.reset(anchor).focus();
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
			
			this.__popup.hide().removeClass('ui-popup-show');
			this.__backdrop.hide();
			this.open = false;
			this.blur();

			this.__dispatchEvent('close');
		};
	
		return this;
	},


	/**
	 * 插入内容
	 * @param	{String}
	 */
	html: function (content) {
		this.__popup.html(content);
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
		
		this.__unlock();
		this.__popup.remove();
		this.__backdrop.remove();


		// 恢复焦点，照顾键盘操作的用户
		this.blur();

		$(window).off('resize', this.__onresize);

		this.__dispatchEvent('remove');

		for (var i in this) {
			delete this[i];
		}

		return this;
	},


	/** 手动刷新位置 */
	reset: function (anchor) {

		var elem = anchor || this.follow;
		elem ? this.__follow(elem) : this.__center();
		this.__dispatchEvent('reset');

		return this;
	},


	/** 让浮层获取焦点 */
	focus: function () {

		var node = this.node;
		var current = Popup.current;

		if (current && current !== this) {
			current.blur(false);
		}

		// 检查焦点是否在浮层里面
		if (!$.contains(node, this.__getActive())) {
			this.__focus(this.__popup.find('[autofocus]')[0] || node);
		}

		Popup.current = this;
		this.__popup.addClass('ui-popup-focus');
		this.__zIndex();
		this.__dispatchEvent('focus');

		return this;
	},


	/** 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户 */
	blur: function () {

		var activeElement = this.__activeElement;
		var isBlur = arguments[0];

		// ie11 bug: iframe 页面点击会跳到顶部
		if (isBlur !== false && activeElement && !/^iframe$/i.test(activeElement.nodeName)) {
			this.__focus(activeElement);
		}

		this.__popup.removeClass('ui-popup-focus');
		this.__dispatchEvent('blur');

		return this;
	},


	/**
	 * 添加事件
	 * @param	{String}	事件类型
	 * @param	{Function}	监听函数
	 */
	addEventListener: function (type, callback) {
		this.__getEventListener(type).push(callback);
		return this;
	},


	/**
	 * 删除事件
	 * @param	{String}	事件类型
	 * @param	{Function}	监听函数
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

		this['on' + type] && this['on' + type]();

		for (var i = 0; i < listeners.length; i ++) {
			listeners[i].call(this);
		}
	},


	// 对元素安全聚焦
	__focus: function (elem) {
		// 防止 iframe 跨域无权限报错
		// 防止 IE 不可见元素报错
		try {
			this.autofocus && elem.focus();
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


	// 置顶浮层
	__zIndex: function () {
	
		var index = Popup.zIndex ++;
		
		// 设置叠加高度
		this.__popup.css('zIndex', index);
		this.__backdrop.css('zIndex', index - 1);
		this.zIndex = index;
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

		this.__clearFollow();
	},
	
	
	// 指定位置 @param    {HTMLElement, Event}  anchor
	__follow: function (anchor) {
		
		var $elem = anchor.parentNode && $(anchor);
		
		// 偏差值，主要针对气泡浮层的箭头
		var OFFSET = $elem ? this.offset : 0;

		// 隐藏元素不可用
		if ($elem) {
			var offset = $elem.offset();
			if (offset.left * offset.top <= 0) {
				return this.__center();
			}
		};
		
		
		var className = 'ui-popup-';
		var fixed = this.fixed;
		var popup = this.__popup;


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
		var setLeft = left;
		var setTop = top + height;
		var dl = fixed ? 0 : docLeft;
		var dt = fixed ? 0 : docTop;


		// 计算相对位置（尚未完成）
		/*var getPopupOffset = function (argv) {
			var a = argv.split('');
			// 目标坐标 | 目标尺寸 | 箭头尺寸 | 浮层尺寸
			var argvs = {
				n: setTop + OFFSET,
				w: setLeft,
				e: left + width - popupWidth,
				s: top - OFFSET - popupHeight
			};

			return {
				left: argvs[b],
				top: argvs[a]
			};
		};*/

		if ((setTop + popupHeight > winHeight + dt) && (top - popupHeight > dt)) {
			setTop = top - popupHeight - OFFSET;
			className += 's';
		} else {
			setTop = setTop + OFFSET;
			className += 'n';
		}


		if ((setLeft + popupWidth > winWidth + dl) && (left - popupWidth > dl)) {
			setLeft = left - popupWidth + width;
			className += 'e';
		} else {
			className += 'w';
		}

		popup.css({
			left: setLeft,
			top: setTop
		});
		
		
		this.__clearFollow();
		this.__followSkin = className;
		this.follow = anchor;


		if ($elem) {
			popup.addClass(className);
		}

	},


	// 清理定位缓存信息
	__clearFollow: function () {
		if (!this.follow) {
			return;
		}
		this.__popup.removeClass(this.__followSkin);
		delete this.follow;
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

		// {Element Ifarme}
		var frameElement = defaultView.frameElement;
		var $ownerDocument = $(ownerDocument);
		var docLeft =  $ownerDocument.scrollLeft();
		var docTop = $ownerDocument.scrollTop();
		var frameOffset = $(frameElement).offset();
		var frameLeft = frameOffset.left;
		var frameTop = frameOffset.top;


		/*
		// 递归计算 iframe 中的位置（尚未完成）
		var frameElement;
		var frameOffset;
		var frameLeft = 0;
		var frameTop = 0;
		while (window !== defaultView) {
			frameElement = defaultView.frameElement;
			frameOffset = $(frameElement, defaultView.parent).offset();
			frameLeft += frameOffset.left;
			frameTop += frameOffset.top;
			defaultView = defaultView.parent;
        }
        */
        

		return {
			left: offset.left + frameLeft - docLeft,
			top: offset.top + frameTop - docTop
		};
	},
	
	
	// 设置屏锁遮罩
	__lock: function () {

		var that = this;
		var popup = this.__popup;
		var backdrop = this.__backdrop;
		var backdropCss = {
			position: 'fixed',
			left: 0,
			top: 0,
			width: '100%',
			height: '100%',
			overflow: 'hidden',
			userSelect: 'none',
			opacity: 0,
			background: this.backdropBackground
		};


		popup.addClass('ui-popup-modal');
		

		// 避免遮罩不能盖住上一次的对话框
		// 如果当前对话框是上一个对话框创建，点击的那一瞬间它会增长 zIndex 值
		Popup.zIndex = Popup.zIndex + 2;
		this.__zIndex();


		if (!_isFixed) {
			$.extend(backdropCss, {
				position: 'absolute',
				width: $(window).width() + 'px',
				height: $(document).height() + 'px'
			});
		};


		backdrop
		.css(backdropCss)
		.animate({opacity: this.backdropOpacity}, 150)
		.appendTo('body')
		// 锁住模态对话框的 tab 简单办法
		// 甚至可以避免焦点落入对话框外的 iframe 中
		.attr({tabindex: '0'})
		.on('focus', function () {
			that.focus();
		});

	},
	

	// 卸载屏锁遮罩
	__unlock: function () {

		if (this.modal) {
			this.__popup.addClass('ui-popup-modal');
			this.__backdrop.remove();
			delete this.modal;
		}
	}
	
});


/** 当前叠加高度 */
Popup.zIndex = 1024;


/** 顶层浮层的实例 */
Popup.current = null;


Popup.oncreate = $.noop;


function Select (select, options) {

	$.extend(this, options || {});

	var that = this;
	var isIE6 = !('minWidth' in $('html')[0].style);

	select = this.select = $(select);

	if (select.is('[multiple]')) {
		return;
	}

	if (select.data('selectbox')) {
		// 删除上一次的 selectbox 以重新更新
		select.data('selectbox').remove();
	}


	var selectboxHtml = this._tpl(this.selectboxHtml, $.extend({
		textContent: that._getOption().html()
	}, select.data()));


	this._selectbox = $(selectboxHtml);
	this._value = this._selectbox.find('[data-value]');
	//this._globalClick = $.proxy(this._globalClick, this);
	this._globalKeydown = $.proxy(this._globalKeydown, this);


	select
	.on('focus blur', function (event) {
		that[event.type]();
		event.preventDefault();
	})
	.on('change', function () {
		var text = that._getOption().html();
		that._value.html(text);
	});


	this._selectbox
	.on('click focus blur', function (event) {
		that[event.type]();
	})
	.css({
		width: select.outerWidth() + 'px'
	});
	

	this._value.css({
		height: select.outerHeight() + 'px',
		lineHeight: select.outerHeight() + 'px'
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
		zIndex: this.showDropdown ? -1 : 1
	}).data('selectbox', this);

	select.after(this._selectbox);
};

var popup = function () {};
popup.prototype = Popup.prototype;
Select.prototype = new popup;

$.extend(Select.prototype, {

	selectboxHtml:
	  '<div class="ui-selectbox" hidefocus="true" style="user-select:none" onselectstart="return false" tabindex="-1" aria-hidden>'
	+     '<div class="ui-selectbox-inner" data-value="">{{textContent}}</div>'
	+     '<i class="ui-selectbox-icon"></i>'
	+ '</div>',
	
	dropdownHtml:  '<dl class="ui-selectbox-dropdown" role="menu">{{options}}</dl>',
	optgroupHtml:  '<dt class="ui-selectbox-optgroup">{{label}}</dt>',
	optionHtml:    '<dd class="ui-selectbox-option {{className}}" data-option="{{index}}" tabindex="-1">{{textContent}}</dd>',
	selectedClass: 'ui-selectbox-selected',
	disabledClass: 'ui-selectbox-disabled',
	focusClass:    'ui-selectbox-focus',
	openClass:     'ui-selectbox-open',
	showDropdown:  !('createTouch' in document),

	selectedIndex: 0,
	value: '',


	close: function () {
		this._popup && this._popup.close().remove();
	},


	show: function () {

		var that = this;
		var select = this.select;

		if (select[0].disabled) {
			return false;
		};


		var popup = this._popup = new Popup;
		popup.offset = 0;
		popup.backdropOpacity = 0;
		popup.html(this._dropdownHtml());

		this._dropdown = $(popup.node);

		this._dropdown
		.on('click', '[data-option]', function (event) {
			var index = $(this).data('option');
			that.selected(index);
			that.close();

			event.preventDefault();
		});


		popup.onshow = function () {
			$(document).on('keydown', that._globalKeydown);
			that._selectbox.addClass(that.openClass);
		};


		popup.onremove = function () {
			$(document).off('keydown', that._globalKeydown);
			that._selectbox.removeClass(that.openClass);
		};

		$(popup.backdrop).on('click', function () {
			that.close();
		});

		popup.showModal(this._selectbox[0]);

		var isIE6 = !('minWidth' in $('html')[0].style);
		var children = this._dropdown.children();

		this._dropdown
		.css({
			minWidth: that._selectbox.outerWidth()
		});

		// 宽度设置这里可以想办法再优化下
		children.css({
			minWidth: that._selectbox.outerWidth() - 2, // 仅 IE7
			width: isIE6 ? Math.max(select.outerWidth(), children.outerWidth()) : children.width(), // 避免 IE8 hover 怪异 BUG
			overflowY: 'auto',
			overflowX: 'hidden',
			maxHeight: $(window).height() - select.outerHeight()
		});
	},


	selected: function (index) {

		if (this._getOption(index).attr('disabled')) {
			return false;
		};

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

		// 更新 Select 对象属性
		this.value = value;
		this.selectedIndex = index;

		this.change();

		return true;
	},


	change: function () {
		if (!this.select[0].disabled) {
			this.select[0].selectedIndex = this.selectedIndex;
			this.select[0].value = this.value;
			this.select.triggerHandler('change');
		}
	},


	click: function () {
		if (!this.select[0].disabled) {
			this._popup && this._popup.open ? this.close() : this.show();
		}
	},


	focus: function () {
		if (!this.select[0].disabled) {
			this._selectbox.addClass(this.focusClass);
		};
	},


	blur: function () {
		if (!this.select[0].disabled) {
			this._selectbox.removeClass(this.focusClass);
		};
	},


	remove: function () {
		this.close();
		this._selectbox.remove();
	},


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
				var className = this.selected
				? that.selectedClass :
					this.disabled ? that.disabledClass : '';

				options += that._tpl(that.optionHtml, $.extend({
						value: $this.val(),
						// 如果内容类似： &#60;s&#62;选项&#60;/s&#62;
						// 使用 .text() 会导致 XSS
						// 另外，原生 option 不支持 html 文本
						textContent: $this.html(),
						index: index,
						className: className
					}, $this.data(), selectData))

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
	_go: function (n) {
		var min = 0;
		var max = this.select[0].length - 1;
		var index = this.select[0].selectedIndex + n;
		
		if (index >= min && index <= max) {
			// 跳过带有 disabled 属性的选项
			if (!this.selected(index)) {
				this._go(n + n);
			}
		}
	},


	// 全局键盘监听
	_globalKeydown: function (event) {

		var length = this.select[0].length;
		var index = this.select[0].selectedIndex;
		var p;

        switch (event.keyCode) {
            case 8:
                // backspace
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

            	this._go(-1);
                p = true;
                break;

            // down
            case 40:

            	this._go(1);
                p = true;
                break;
        }

        p && event.preventDefault();
	}

});


return function (elem, options) {
	// 注意：不要返回 Select 更多接口给外部，只保持装饰用途，以便后续可以灵活取消装饰

	if (elem.type === 'select') {
		new Select(elem, options);
	} else {
		$(elem).each(function () {
			new Select(this, options);
		});
	}
};

})(jQuery);