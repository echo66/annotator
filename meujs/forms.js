function annotationDialog(aid,dataServer) {

    dataServer.getAnnotation(aid,function(err,annotation){
        var prefix = (Math.random() + "").replace(/\./g,"-");
        if (!err) {
            dataServer.getAnnotationsTypes(annotation.types, function(err,types){
                if(!err) {
                    BootstrapDialog.show({
                        title: "Edit <b>" + annotation.title + "</b> info",
                        message: function() {
                            console.log('message');
                            var s = 
                                create_form_fields(prefix,[
                                    {id: 'id', type: 'static-text', label: 'ID', value: annotation._id},
                                    {id: 'title', type: 'text', label: 'Title', value: annotation.title, placeholder: "Annotation Title"},
                                    {id: 'description', type: 'textarea', label:'Description', value: annotation.description, placeholder: "Annotation Description"},
                                    {id: 'types', type: 'tags', label: 'Types'},
                                    {id: 'color', type: 'text', label: 'Color', value: annotation.color}, 
                                    {id: 'period', type: 'static-text', label: 'Period', value: (annotation.start + " => " + annotation.end)}
                                ]);
                            return s;
                        },
                        onshow: function(dialog){

                            var url = 'http://localhost:5984/music-annotation/_design/projections/_list/query_title/annotations-types?title=%QUERY';
                            init_tags_input(url, annotation._id, prefix, dialog, types);
                            
                        },
                        buttons: [
                            {
                                label: 'Save',
                                action: function(dialog){
                                    // ANNOTATION DATA
                                    var modal = dialog.getModalBody();
                                    annotation.title = modal.find("#"+prefix+"-title-form-input").val();
                                    annotation.description = modal.find("#"+prefix+"-description-form-input").val();
                                    annotation.color = modal.find("#"+prefix+"-color-form-input").val();
                                    annotation.types = modal.find("#"+prefix+"-types-form-input").tagsinput('items').map(function(el){ return el._id; });
                                    dataServer.updateAnnotation(annotation, function(err,resp){
                                        if (!err) 
                                            dialog.close();
                                    });
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
                }
            })
            
        }
    });
    
}

function annotationsTrackDialog(anntrackid) {
    //TODO
    //TITLE: TEXT | EDITABLE
    //DESCRIPTION: TEXT | EDITABLE
    //TYPES: LIST | EDITABLE
    //Nº ANNOTATIONS: INTEGER
    //ADD TYPE: BUTTON or DROPDOWN
    //ADD TEXT DESCRIPTION: BUTTON

    dataServer.getAnnotationsTrack(anntrackid,function(err,anntrack){
        var prefix = (Math.random() + "").replace(/\./g,"-");
        if (!err) {
            dataServer.getAnnotationsTracksTypes(anntrack.types, function(err,types){
                if(!err) {
                    BootstrapDialog.show({
                        title: "Edit <b>" + anntrack.title + "</b> info",
                        message: function() {
                            var s = 
                                create_form_fields(prefix,[
                                    {id: 'id', type:'static-text', label:'ID', value:anntrack._id},
                                    {id: 'title', type:'text', label:'Title', value:anntrack.title, placeholder: "Annotation Title"},
                                    {id: 'description', type:'textarea', label:'Description', value:anntrack.description, placeholder: "Annotation Description"},
                                    {id: 'types', type:'tags', label:'Types'}
                                ]);
                            return s;
                        },
                        onshow: function(dialog){

                            var url = 'http://localhost:5984/music-annotation/_design/projections/_list/query_title/annotations-tracks-types?title=%QUERY';
                            init_tags_input(url, anntrack._id, prefix, dialog, types);
                            
                        },
                        buttons: [
                            {
                                label: 'Save',
                                action: function(dialog){
                                    // ANNOTATION DATA
                                    var modal = dialog.getModalBody();
                                    anntrack.title = modal.find("#"+prefix+"-title-form-input").val();
                                    anntrack.description = modal.find("#"+prefix+"-description-form-input").val();
                                    anntrack.types = modal.find("#"+prefix+"-types-form-input").tagsinput('items').map(function(el){ return el._id; });
                                    dataServer.updateAnnotationsTrack(anntrack, function(err,resp){
                                        if (!err) {
                                            $('#annotations-track-title-'+anntrack._id).html(anntrack.title);
                                            $('option[value="'+anntrack._id+'"]').html(anntrack.title);
                                            dialog.close();
                                        }
                                    });
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
                }
            })
            
        }
    });
    
}


function annotationTypeDialog(anntypeid) {
    var prefix = (Math.random() + "").replace(/\./g,"-");
    if (anntypeid==undefined) {
        BootstrapDialog.show({
            title: "Create Annotation Type",
            message: function() {
                var s = 
                    create_form_fields(prefix,[
                        {id: 'title', type: 'text', label: 'Title', value: '', placeholder: "Insert Type Title"},
                        {id: 'description', type: 'textarea', label:'Description', value: '', placeholder: "Insert Type Description"},
                        {id: 'subtypes', type: 'tags', label: 'Sub-Types'},
                        {id: 'supertypes', type: 'tags', label: 'Super-Types'}
                    ]);
                return s;
            },
            onshow: function(dialog){

                var url = 'http://localhost:5984/music-annotation/_design/projections/_list/query_title/annotations-types?title=%QUERY';
                init_tags_input(url, "subtypes", prefix, dialog, []);
                init_tags_input(url, "supertypes", prefix, dialog, []);
                
            },
            buttons: [
                {
                    label: 'Save',
                    action: function(dialog){
                        // ANNOTATION DATA
                        var modal = dialog.getModalBody();
                        var annType = {};
                        annType.title = modal.find("#"+prefix+"-title-form-input").val();
                        annType.description = modal.find("#"+prefix+"-description-form-input").val();
                        dataServer.createAnnotationType(annType, function(err,resp){
                            if (!err) 
                                dialog.close();
                        });
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
    } else {
        //TODO
    }
}


function relationDialog() {
    //TODO
}


function create_form_fields(prefix, fields) {
    var s = "";
    s += '<div class="row"> <div class="col-md-12"> <form class="form-horizontal"> ';

    fields.forEach(function(field) {
        var type = field.type;
        var id = field.id;
        var label = field.label;
        var value = field.value;
        var placeholder = field.placeholder;
        if (type=='static-text') {
            s += 
                '<div class="form-group"> ' +
                    '<label class="col-md-2 control-label" for="'+prefix+'-'+id+'">'+label+'</label>' + 
                    '<div class="col-md-10" id="'+prefix+'-'+id+'"> ' +
                        value +
                    '</div> ' +
                '</div>';
        } else if (type=='text') {
            s += 
                '<div class="form-group"> ' +
                    '<label class="col-md-2 control-label" for="'+prefix+'-'+id+'-form-input">Title</label> ' +
                    '<div class="col-md-10"> ' +
                        '<input id="'+prefix+'-'+id+'-form-input" name="'+prefix+'-'+id+'-form-input" type="text" value="'+value+'" placeholder="'+placeholder+'" class="form-control input-md"/> ' +
                    '</div> ' +
                '</div>';
        } else if (type=='textarea') {
            s += 
                '<div class="form-group"> ' +
                    '<label class="col-md-2 control-label" for="'+prefix+'-'+id+'-form-input">'+label+'</label>' +
                    '<div class="col-md-10"> ' +
                        '<textarea class="form-control" id="'+prefix+'-'+id+'-form-input" name="'+prefix+'-'+id+'-form-input" rows="3">'+value+'</textarea>' +
                    '</div>' +
                '</div>';
        } else if (type=='tags') {
            s +=
                '<div class="form-group"> ' +
                    '<label class="col-md-2 control-label" for="'+prefix+'-'+id+'-form-input">'+label+'</label>' +
                    '<div class="col-md-10"> ' +
                        '<input type="text" id="'+prefix+'-'+id+'-form-input" name="'+prefix+'-'+id+'-form-input" data-role="tagsinput" /> '+
                    '</div> ' +
                '</div>';
        }
    });

    s += '</form></div></div>';

    return s;
}

function init_tags_input(url,id,prefix,dialog,types) {
    var dataset = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: url 
        //TODO: How can I use dataServer in here??
    });
    dataset.initialize();

    var tagsinputfield = dialog.getModalBody().find("input[name='"+prefix+"-"+id+"-form-input']");

    
    tagsinputfield.tagsinput({
        itemValue: '_id',
        itemText: 'title',
        typeaheadjs: {
            displayKey: 'title',
            source: dataset.ttAdapter()
        }
    });

    types.map(function(el){ tagsinputfield.tagsinput('add',el); });
}