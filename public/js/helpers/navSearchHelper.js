function navSearchHelper() {
}
navSearchHelper.prototype.submitSearch = function() {
    //var query = this.getQueryString();
    var categories = this.getActiveCategories();
    var ageGroups = this.getActiveAgeGroups();
    //var urlParams = query;
    if(categories.length != 0) {
        for(var i in categories) {
            $("#_nav_search_form").append("<input type=\"hidden\" name="+ categories[i].name+" value=\""+ categories[i].value+"\">");
        }
        //urlParams += "&" + categories;
    }
    if(ageGroups.length != 0) {
        for(var i in ageGroups) {
            $("#_nav_search_form").append("<input type=\"hidden\" name="+ ageGroups[i].name+" value=\""+ ageGroups[i].value+"\">");
        }
        //urlParams += "&" + ageGroups;
    }
    //var searchUrl = "/toys/search?" + urlParams;
    debugger;
    //$("#_nav_search_form").attr("action", searchUrl);
    $("#_nav_search_form").submit();
}

navSearchHelper.prototype.getQueryString = function() {
    return $("#_nav_search_form").serializeArray();
}

navSearchHelper.prototype.getActiveCategories = function() {
    return $("#_nav_category_form").serializeArray();
}
navSearchHelper.prototype.getActiveAgeGroups = function() {
    return $("#_nav_age_group_form").serializeArray();
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
  $("#_nav_search_button").click(function(event) {
    event.preventDefault();
    new navSearchHelper().submitSearch();
  }) ;
}
