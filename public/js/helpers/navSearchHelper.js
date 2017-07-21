function navSearchHelper() {
}
navSearchHelper.prototype.submitSearch = function() {
    var query = this.getQueryString();
    var categories = this.getActiveCategories();
    var ageGroups = this.getActiveAgeGroups();
    //var urlParams = query;
    $("#_nav_search_form").append("<input type=\"hidden\" name="+ query[0].name+" value=\""+ query[0].value+"\">");
    var i;
    if(categories.length !== 0) {
        for(i = 0; i < categories.length; i++) {
            $("#_nav_search_form").append("<input type=\"hidden\" name="+ categories[i].name+" value=\""+ categories[i].value+"\">");
        }
        //urlParams += "&" + categories;
    }
    if(ageGroups.length !== 0) {
        for(i = 0; i < ageGroups.length; i++) {
            $("#_nav_search_form").append("<input type=\"hidden\" name="+ ageGroups[i].name+" value=\""+ ageGroups[i].value+"\">");
        }
        //urlParams += "&" + ageGroups;
    }
    //var searchUrl = "/toys/search?" + urlParams;
    //$("#_nav_search_form").attr("action", searchUrl);
    $("#_nav_search_form").submit();
}

navSearchHelper.prototype.getQueryString = function() {
    return $(".nav_search_form:visible").serializeArray();
}

navSearchHelper.prototype.getActiveCategories = function() {
    return $("#_nav_category_form").serializeArray();
}
navSearchHelper.prototype.getActiveAgeGroups = function() {
    return $("#_nav_age_group_form").serializeArray();
}

navSearchHelper.prototype.toggleFilterBar = function() {
    if($("#_nav_filter_side").hasClass("nav_sidenav_open")) {
        $("#_nav_filter_side").removeClass("nav_sidenav_open");
    }
    else {
        $("#_nav_filter_side").addClass("nav_sidenav_open");
    }
    if($(".nav_main_content").hasClass("nav_sidenav_open")) {
        $(".nav_main_content").removeClass("nav_sidenav_open");
    }
    else {
        $(".nav_main_content").addClass("nav_sidenav_open");
    }
    /*$(".nav_main_content").toggleClass("nav_sidenav_open");
    $("#_nav_filter_side").toggleClass("nav_sidenav_open");*/
} 

navSearchHelper.prototype.closeFilterBar = function() {
    $("#_nav_filter_side").removeClass("nav_sidenav_open");
    $(".nav_main_content").removeClass("nav_sidenav_open");
} 
navSearchHelper.prototype.openFilterBar = function() {
    $("#_nav_filter_side").addClass("nav_sidenav_open");
    $(".nav_main_content").addClass("nav_sidenav_open");
} 
registerSearchHelpers();

function registerSearchHelpers() {
   $("#_nav_category_form :checkbox").change(function(event) {
       event.preventDefault();
       new navSearchHelper().submitSearch();
   } ); 
   $("#_nav_age_group_form :checkbox").change(function(event) {
       event.preventDefault();
       new navSearchHelper().submitSearch();
   } );
  $(".nav_search_button").click(function(event) {
    event.preventDefault();
    new navSearchHelper().submitSearch();
  }) ;
  $("#_nav_filter_btn").click(function(event) {
    event.preventDefault();
    new navSearchHelper().toggleFilterBar();
    event.stopPropagation();
  });
  $(".nav_main_content").click(function(event) {
    event.preventDefault();
    new navSearchHelper().closeFilterBar();

  })
}
