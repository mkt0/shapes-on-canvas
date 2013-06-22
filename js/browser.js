$(function () {
	if ( $.browser.msie ) {
		if ($.browser.version != "10.0") {
			window.location.replace("nocanvas.html");
		};
	};
});