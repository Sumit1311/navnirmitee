$(document).ready(function() {
	
	// Contact Maps
    /*
	$("#maps").gmap3({
		map: {
			options: {
			  center: [-7.866315,110.389574],
			  zoom: 8,
			  scrollwheel: false
			}  
		 },
		marker:{
			latLng: [-7.866315,110.389574],
			options: {
			 icon: new google.maps.MarkerImage(
			   "https://dl.dropboxusercontent.com/u/29545616/Preview/location.png",
			   new google.maps.Size(48, 48, "px", "px")
			 )
			}
		 }
	});*/
	
    $('[data-toggle="popover"]').popover();
	//Slider
	$("#slider").carousel({
		interval: 5000
	});
	
	$("#testi").carousel({
		interval: 4000
	});
	
	$("#itemsingle").carousel({
		interval: false
	});

});

$(function(){
    /*$("#modal").on("shown.bs.modal",function(){
        $("#_nav_createaccount").click(createAccount);    
        $("#_nav_haveanaccount").click(createAccount);    
        $("#_nav_forgotpassword").click(resetPassword);
    })*/
})

