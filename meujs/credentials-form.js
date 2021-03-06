function credentialsDialog(mode,dataServer,customHandler) {
    var prefix = (Math.random() + "").replace(/\./g,"-");
    var title = "";
    var repeatPassword = "";

    if (mode=='login') { 
        title="Login"; 
    } else if (mode=='signup') { 
        title="Sign Up"; 
        repeatPassword ='<div class="form-group"> ' +
                        '<label class="col-md-2 control-label" for="'+prefix+'-password-2-'+mode+'">password</label> ' +
                        '<div class="col-md-8"> ' +
                            '<input id="'+prefix+'-password-2-'+mode+'" name="'+prefix+'-password-2-'+mode+'" type="text" value="" placeholder="Insert password again" class="form-control input-md"/> ' +
                        '</div> ' +
                    '</div>' ;
    }

    var dialog = new BootstrapDialog({
        title: title,
        message: function() {
            var s =
                '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                        '<form class="form-horizontal"> ' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="'+prefix+'-username'+mode+'">Username</label> ' +
                                '<div class="col-md-8"> ' +
                                    '<input id="'+prefix+'-username-'+mode+'" name="'+prefix+'-username-'+mode+'" type="text" value="" placeholder="Insert username" class="form-control input-md"/> ' +
                                '</div> ' +
                            '</div>' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="'+prefix+'-password'+mode+'">Password</label> ' +
                                '<div class="col-md-8"> ' +
                                    '<input id="'+prefix+'-password-'+mode+'" name="'+prefix+'-password-'+mode+'" type="text" value="" placeholder="Insert password" class="form-control input-md"/> ' +
                                '</div> ' +
                            '</div>' +
                            repeatPassword + 
                        '</form>' +
                    '</div>' +
                '</div>';
            return s;
        },
        buttons: [
            {
                label: title,
                hotkey: 13,
                action: function(dialog){
                    var username = $('#'+prefix+'-username-'+mode).val();
                    var password = $('#'+prefix+'-password-'+mode).val();
                    if (mode=='login') 
                        dataServer.login(username, password, customHandler);
                    else if (mode=='signup') {
                        var password2 = $('#'+prefix+'-password-2-'+mode).val();
                        if (password==password2) 
                            dataServer.signUp(username,password,function(err,resp){
                                if (customHandler)
                                    customHandler(err,{username:username,password:password});
                            });
                        else {
                            // ERROR
                        }
                    }
                }
            }
        ]
    });

    dialog.open();

    return dialog;
}