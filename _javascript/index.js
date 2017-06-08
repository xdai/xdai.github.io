$( document ).ready(function() {
    console.log( "ready!" );

    $(".meta").mouseenter(function(){
	$(".toggle", this).toggle("fast");
    }).mouseleave(function(){
	$(".toggle", this).toggle("fast");
    });
});
