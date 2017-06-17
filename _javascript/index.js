$( document ).ready(function() {
    initMetaBlock();
    initMobileMenu();
});

function initMetaBlock() {
    $(".meta").mouseenter(function(){
	$(".toggle", this).toggle("fast");
    }).mouseleave(function(){
	$(".toggle", this).toggle("fast");
    });
}

function initMobileMenu() {
    $("#mobile-menu").click(function() {
	$("#mobile-menu-o").show(0, function() {
	    $("#mobile-menu-o").css({
                opacity: "0.85",
                transform: "translate3d(-" + (Math.round(($(window).width() - 200) / 2) - 20) + "px, -20px, 0px)",
	    });
	    $("#mobile-menu").hide();
	    $("#mobile-overlay").show();

	    // Disable scroll
	    $("body").addClass("no-scroll");
	    document.ontouchmove = function(e){ e.preventDefault(); }
	});
    });

    $("#mobile-overlay, #mobile-menu-btn-x").click(function() {
	$("#mobile-menu-o").css({
            opacity: "0",
            transform: "translate3d(0px, 0px, 0px) scale(0.1)",
        }).one(
	    "webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend",
	    function() {
		$("#mobile-menu-o").hide();
		$("#mobile-menu").show();
		$("#mobile-overlay").hide();

		// Enable scroll
		$("body").removeClass("no-scroll");
		document.ontouchmove = function(e){ return true; }
            }
	);
    });
}
