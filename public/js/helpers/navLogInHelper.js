function navLogInHelper() {
}

navLogInHelper.prototype.logInHandler = function(event, that) {
           var form = $(that);
           event.preventDefault();
           /*form.validate({
            errorClass : "error help-block",
            rules : {
                email : {
                    required : true,
                    email : true
                }
            },
            messages : {
                email : {
                    required : "Please specify an email address",
                    email : "Invalid email address"
                }
            },
            errorElement: "em",
            highlight : function(element, errorClass, validClass) {
                $(element).parent().addClass('has-error');
            },
            submitHandler : self.logIn
           })*/
           debugger;
           $("#_nav_login_button").prop('disabled', true);;
           var self = this;
           this.logIn(form)
           .catch(function(error){
               if(typeof error == "string") {
                self.showError(error);
               } else {
                self.showError(error.subMessage);
               }
               $("#_nav_login_button").prop('disabled', false);;
           });
}

navLogInHelper.prototype.logIn = function(form) {
    var body = form.serialize();
    //console.log(body);
    return navRequestHandler().doRequest(form.attr('action'), 'POST', body);
}

navLogInHelper.prototype.showError = function(message) {
    $("#_nav_login_error .alert").text(message);
    $("#_nav_login_error").removeClass("hidden");
}
