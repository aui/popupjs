define(function (require) {

var $ = require('jquery');
var Popup = require('../popup');
var drag = require('../drag/drag');
var dialog = require('../drag/dialog')
var start = drag.types.start;

Popup.oncreate = function (api) {
	$(api.node).on(start, '[i=title]', function (event) {
		if (!api.follow) {
			drag.create(api.node, event);
		}
	});
};

return dialog;

});