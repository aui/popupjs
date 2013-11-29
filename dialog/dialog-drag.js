define(function (require) {

var $ = require('jquery');
var Popup = require('../popup');
var drag = require('../drag/drag');
var dialog = require('../drag/dialog')
var start = drag.types.start;

Popup.oncreate = function (api) {
	function bind (event) {
		if (!api.follow) {
			drag.create($(api.node), event);
		}
	};

	$(api.node).on(start, '[i=title]', bind);
	api.addEventListener('remove', bind, false);
};

return dialog;

});


