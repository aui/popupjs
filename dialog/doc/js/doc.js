define(function (require) {
	var $ = require('jquery');
	var dialog = require('../../dialog');
	var sh_languages = require('./sh_languages');
	var css = '../css/doc.css';


	// css loader: RequireJS & SeaJS
	css = require[require.toUrl ? 'toUrl' : 'resolve'](css);
	css = '<link rel="stylesheet" href="' + css + '" />';
	$('base')[0] ? $('base').before(css) : $('head').append(css);

	window.dialog = dialog;
	window.$ = window.jQuery = $;
	window.console = window.console || {
		log: $.noop
	};

	window.openDialog = function (options) {
		var options = arguments[0];
		var url = options.url;
		//var oniframeload = options.oniframeload;
		var loader = window.require ? require : seajs.use;
		loader([
			'../dialog',
			'../dialog-iframe'
		], function (dialog, openIframe) {
			var api = url ? openIframe(options) : dialog(options);
			api.showModal();
			window.__dialog__ = dialog;
		});
	};

	window.getDialog = function (win) {
		var dialog = window.__dialog__;
		if (!dialog) {
			return;
		}
		// 从 iframe 传入 window 对象
		if (win && win.frameElement) {
			var iframe = win.frameElement;
			var list = dialog.get();
			var api;
			for (var i in list) {
				api = list[i];
				if (jQuery.contains(api.node, iframe)) {
					return api;
				}
			}
		// 直接传入 id 的情况
		} else if (win) {
			return dialog.get(win);
		}
	};


	var codes = {};
	var debug = location.href.indexOf('Users/tangbin') !== -1;

	$(function () {

		console.log('你可以在调试器中粘贴本页示例代码运行');

		var RE = /[\n\s\t]*?\/\/\.\.[\r\n]/;
		$('pre code').each(function (index) {
			var $this = $(this);
			var code = $this.text();


			$this.addClass('sh_javascript')

			// 忽略不完整的代码片段
			// 开头使用"//.."表示
			if (RE.test(code)) {
				$this.text(code.replace(RE, ''));
				return;
			}

			try {
				codes[index] = new Function(code);
			} catch (e) {
				return;
			}

			$this
			//.addClass('sh_javascript')
			.after('<div class="doc-line"></div>'
				+'<button data-code="' + index + '">运行</button>');
		});

		// 代码高亮
		setTimeout(sh_languages, 150);

		// 回到顶部
		var $top = $('<a class="doc-gotop" href="javascript:;">TOP</a>')
		.on('click', function () {
			$(window).scrollTop(0);
			return false;
		});
		$('body').append($top);

		// 加载拖拽插件
		$('h1 code').one('click', function () {
			if (require.async) {
				require.async('../../dialog-drag');
			}
		});
	});


	var runCode = function (id) {
		codes[id]();

		var api = dialog.getCurrent();
		if (debug && api) {
			console.log(api);
		}
	};


	$(document).on('click', '[data-code]', function () {
		var id = $(this).data('code');
		runCode(id);
		return false;
	});





});