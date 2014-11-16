function credentialsDialog(mode,dataServer) {
    var prefix = (Math.random() + "").replace(/./g,"-");
    var title = "";
    var extrafield = "";
    if (mode=='login') { 
        title="Login"; 
    } else if (mode=='signup') { 
        title="Sign Up"; 
        extrafield ='<div class="form-group"> ' +
                        '<label class="col-md-2 control-label" for="'+prefix+'-password-2-'+mode+'">password</label> ' +
                        '<div class="col-md-8"> ' +
                            '<input id='+prefix+'-password-2-'+mode+'" name="'+prefix+'-password-2-'+mode+'" type="text" value="" placeholder="Insert password again" class="form-control input-md"/> ' +
                        '</div> ' +
                    '</div>' ;
    }
    BootstrapDialog.show({
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
                            extrafield + 
                        '</form>' +
                    '</div>' +
                '</div>';
            return s;
        },
        buttons: [
            {
                label: title,
                action: function(dialog){
                    var username = $('#'+prefix+'-'+username+'-'+mode).val();
                    var password = $('#'+prefix+'-'+password+'-'+mode).val();
                    if (mode=='login') {

                    } else if (mode=='signup') {
                        var password2 = var password = $('#'+prefix+'-'+password+'-2-'+mode).val();
                        if (password==password2) {
                            dataServer.signUp(username,password,function(err,resp){
                                if(!err) {
                                    // ERROR
                                } else {
                                    $('#account-dropdown').
                                    dialog.close();
                                }
                            });
                        } else {
                            // ERROR
                        }
                    }
                }
            }
        ]
    });
}