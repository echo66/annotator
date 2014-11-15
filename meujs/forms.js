function annotationDialog(aid) {
    //TODO
    //TITLE: TEXT | EDITABLE
    //DESCRIPTION: TEXT | EDITABLE
    //TYPES: LIST | EDITABLE
    //BEATS: LIST
    //ADD TYPE: BUTTON or DROPDOWN
    //ADD TEXT DESCRIPTION: BUTTON

    var db = dataServer.annotations.db;
    db.get(aid).then(function(annotation){
        BootstrapDialog.show({
        title: "Edit " + annotation.title + " info",
        message: function() {
            var s =
                '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                        '<form class="form-horizontal"> ' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="title">Title</label> ' +
                                '<div class="col-md-8"> ' +
                                    '<input id="title" name="title" type="text" value="'+annotation.title+'" placeholder="Annotation Title" class="form-control input-md"/> ' +
                                '</div> ' +
                            '</div>' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="description">Description</label>' +
                                '<div class="col-md-8"> ' +
                                    '<textarea class="form-control" name="description" rows="3" value="'+annotation.description+'"></textarea>' +
                                '</div>' +
                            '</div>' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="types">Types</label>' +
                                '<div class="col-md-8"> ' +
                                    '<input type="text" name="types" value="Amsterdam,Washington,Sydney,Beijing,Cairo" data-role="tagsinput" /> '+
                                '</div> ' +
                            '</div>' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="nbeats">Start:End</label>' + 
                                '<div class="col-md-8"> ' +
                                    annotation.start + " => " + annotation.end + 
                                '</div> ' +
                            '</div>' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="color">Color</label>' +
                                '<div class="col-md-8"> ' +
                                    '<input id="title" name="color" type="text" value="'+annotation.color+'" placeholder="Annotation Title" class="form-control input-md"/> ' +
                                '</div> ' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</div>';
            return s;
        },
        onshow: function(dialog){
            dialog.getModalBody().find("input[name='types']").tagsinput('items');
        },
        buttons: [
            {
                label: 'Save',
                action: function(dialog){
                    // ANNOTATION DATA
                    annotation.title = dialog.getModalBody().find("input[name='title']").val();
                    annotation.description = dialog.getModalBody().find("textarea[name='description']").val();
                    db.put(annotation).then(function(){dialog.close();});
                    //TODO
                }
            },
            {
                label: 'Play',
                action: function(dialog){
                    //TODO: Don't use wavesurfer objects directly
                    //wavesurfer.play(annotation.start,annotation.end);
                }
            },
            {
                label: 'Show Types Available',
                action: function(dialog){
                    //TODO
                }
            }
        ]
    });
    });


    
}

function annotationsTrackDialog(atid) {
        //TODO
        //TITLE: TEXT | EDITABLE
        //DESCRIPTION: TEXT | EDITABLE
        //TYPES: LIST | EDITABLE
        //Nº ANNOTATIONS: INTEGER
        //ADD TYPE: BUTTON or DROPDOWN
        //ADD TEXT DESCRIPTION: BUTTON
        BootstrapDialog.show({
            title: _track_data.title,
            message: function() {
                var s =
                    '<div class="row">  ' +
                        '<div class="col-md-12"> ' +
                            '<form class="form-horizontal"> ' +
                                '<div class="form-group"> ' +
                                    '<label class="col-md-2 control-label" for="title">Title</label> ' +
                                    '<div class="col-md-8"> ' +
                                        '<input id="title" name="title" type="text" value="'+_track_data.title+'" placeholder="Annotation Title" class="form-control input-md"/> ' +
                                    '</div> ' +
                                '</div>' +
                                '<div class="form-group"> ' +
                                    '<label class="col-md-2 control-label" for="description">Description</label>' +
                                    '<div class="col-md-8"> ' +
                                        '<textarea class="form-control" name="description" rows="3" value="'+_track_data.description+'"></textarea>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="form-group"> ' +
                                    '<label class="col-md-2 control-label" for="types">Types</label>' +
                                    '<div class="col-md-8"> ' +
                                        '<input type="text" name="types" value="Amsterdam,Washington,Sydney,Beijing,Cairo" data-role="tagsinput" /> '+
                                    '</div> ' +
                                '</div>' +
                                '<div class="form-group"> ' +
                                    '<label class="col-md-2 control-label" for="nannotations">Number of annotations</label>' +
                                '</div>' +
                            '</form>' +
                        '</div>' +
                    '</div>';
                return s;
            },
            onshow: function(dialog){
                dialog.getModalBody().find("input[name='types']").tagsinput('items');
            },
            buttons: [
                {
                    label: 'Save',
                    action: function(dialog){
                        //TODO
                    }
                }, {
                    label: 'Show Types Available',
                    action: function(dialog){
                        //TODO
                    }
                }
            ]
        });
    }