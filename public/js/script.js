$(document).ready(function() {
	
	// Contact Maps
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
	});
	
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
        $("#_nav_forgotpassword").click(resetPassword);
        $("#_nav_createanaccount").click(createAccount);
	$("#_nav_login_div > form").submit(function(event) { new navLogInHelper().logInHandler(event, this)});
	$("#_nav_register_div > form").submit(function(event) { new navRegistrationHelper().registrationHandler(event, this)});

})

function createAccount()
{
    $("#_nav_login_div").toggleClass("hidden-xs");
    //toggle($("#_nav_register_div"));
    $("#_nav_register_div").toggleClass("hidden-xs");
}

function resetPassword()
{
    toggle($("#_nav_login_div"));
    toggle($("#_nav_forgot_password_div"));
}

function toggle(element)
{
    $(element).toggleClass("hidden");
}
