'use strict';

var dataServer = new DataServer();

var logging_details;

var annBoard;
var annBoardId;
var numColumns;
var grid;
var musicId;

var fileurl;
var wavesurfer;
var wavesurferScrollbar;

var context;
var osc;
var gain;

var metronomeActive;
var snapToGrid = true;
var trackShownInWavesurfer = -2;

var minPxPerSec = 30;



var eventHandlers = {
    'login': function() {
        var dialog = credentialsDialog('login',dataServer,function(err,resp){
            if (!err) {
                $('#account-dropdown').html(
                    '<a href="#" class="dropdown-toggle" data-toggle="dropdown">'+dataServer.getUsername()+'<span class="caret"></span></a>\
                    <ul class="dropdown-menu" role="menu">\
                        <li><a href="#" data-action="">My data</a></li>\
                        <li><a href="#" data-action="logout">Logout</a></li>\
                    </ul>'
                );
                dialog.close();
                remainingStuff(err,resp);
            }
        });
    },

    'signup': function() {
        var dialog = credentialsDialog('signup',dataServer);
    },

    'logout': function() {
        dataServer.logout(function(err,resp) {
            $('#account-dropdown').html(
                '<a href="#" class="dropdown-toggle" data-toggle="dropdown">Sign In/Up <span class="caret"></span></a>\
                <ul class="dropdown-menu" role="menu">\
                    <li><a href="#" data-action="login">Sign In</a></li>\
                    <li><a href="#" data-action="signup">Sign Up</a></li>\
                </ul>'
            );
            $('.controls').html(controlsHTML);
        });
    },

    'play': function () {
        wavesurfer.playPause();
    },

    'back': function () {
        wavesurfer.skipBackward();
    },

    'forth': function () {
        wavesurfer.skipForward();
    },

    'toggle-mute': function () {
        wavesurfer.toggleMute();
    },

    'toggle-snap-to-grid': function (e) {
        snapToGrid = e.srcElement.checked;
    },

    'toggle-region-creation-on-drag': function(e) {
        if (e.srcElement.checked) {
            wavesurfer.disableInteraction();
            wavesurfer.enableDragSelection({
                color: randomColor(0.5)
            });
        } else {
            wavesurfer.disableDragSelection();
            wavesurfer.enableInteraction();
        }
            
    },

    'clear-regions': function(e) {
        var regions = wavesurfer.regions.list;
        Object.keys(regions).forEach(function (rid) {
            if(!rid)
                return;
            if (regions[rid].type!='beat-grid-marker')
                regions[rid].remove();
        });
    },

    'track-selected-to-sync': function(e) {
        var selectedTrack = $(e.srcElement).val();
        if ((selectedTrack==-1 && selectedTrack==trackShownInWavesurfer) || (selectedTrack==trackShownInWavesurfer)) 
            return;
        clearWavesurferSegments();
        trackShownInWavesurfer = selectedTrack;
        loadAnnotationsOnWavesurfer(trackShownInWavesurfer);
    }
};

document.addEventListener('click', function (e) {
    var action = e.target.dataset && e.target.dataset.action;
    if (action && action in eventHandlers) {
        eventHandlers[action](e);
    }
});

    $(function() {
        dataServer.init();
        dataServer.startShowHandlers();
        dataServer.getSession(function(err,resp){
            if (!err && resp.userCtx.name) {
                $('#account-dropdown').html(
                    '<a href="#" class="dropdown-toggle" data-toggle="dropdown">'+dataServer.getUsername()+'<span class="caret"></span></a>\
                    <ul class="dropdown-menu" role="menu">\
                        <li><a href="#" data-action="">My data</a></li>\
                        <li><a href="#" data-action="logout">Logout</a></li>\
                    </ul>'
                );
                remainingStuff(err,resp);
            }
        });
    })

    function remainingStuff(err,resp) {
        if (!err) {

            logging_details = {};
            logging_details.regions = {dragSelection: false};

            annBoard;
            numColumns = 23;
            annBoardId = 1;
            grid = 40;
            musicId = 1;

            fileurl = "1.mp3";
            wavesurfer = Object.create(WaveSurfer);
            wavesurferScrollbar = Object.create(WaveSurfer.WaveScrollbar);

            context = new AudioContext();
            osc = context.createOscillator();
            gain = context.createGain();
            osc.connect(gain);
            osc.frequency.value = 1000.0;
            osc.start(0);

            metronomeActive = true;


            numColumns = beatdata.length;

            initWavesurfer();
        }
    }
    


    function toggleMetronome() {
        metronomeActive = !metronomeActive
    }


    function addTrack() {
        var tid = annBoard.addAnnotationsTrack();
    }


    function initWavesurfer() {

        var options = {
            audioContext  : context,
            container     : document.querySelector('#waveform'),
            waveColor     : 'violet',
            progressColor : 'purple',
            loaderColor   : 'purple',
            cursorColor   : 'navy',
            minPxPerSec   : minPxPerSec,
            scrollParent  : true,

            selectionColor: 'rgba(255,0,0, .3)',
            selectionForeground: false,
            selectionBorder: true,
            selectionBorderColor: '#d42929',

            //minPxPerSec: 213, //maximum working value
            //minPxPerSec: 100,        
            //pixelRatio: 3,
            cursorWidth: 2
        };

        var progressDiv = document.querySelector('#progress-bar');
        var progressBar = progressDiv.querySelector('.progress-bar');

        var showProgress = function (percent) {
            progressDiv.style.display = 'block';
            progressBar.style.width = percent + '%';
        };

        var hideProgress = function () {
            progressDiv.style.display = 'none';
        };

        wavesurfer.on('loading', showProgress);
        wavesurfer.on('ready', hideProgress);
        wavesurfer.on('destroy', hideProgress);
        wavesurfer.on('error', hideProgress);

        wavesurfer.init(options);
        wavesurfer.load(fileurl);

        wavesurfer.on('ready',function(){
            grid = wavesurfer.drawer.width / beatdata.length;

            wavesurferScrollbar.init({
                container: "#wave-scroll",
                wavesurfer: wavesurfer,
                cursorWidth: 1,
                height:25
            });

            annBoard = new AnnotationsBoardCtr({
                boardContainerId: "annotations-tracks-master-container",
                grid: grid,
                numColumns: numColumns,
                duration: wavesurfer.getDuration(),
                //width: wavesurfer.drawer.width,
                width: Math.round(wavesurfer.getDuration()*minPxPerSec),
                musicId: musicId,
                dataServer: dataServer
            });

            annBoard.init();

            putBeatsOnWavesurfer();

            addWavesurferEventHandlers();
        });
    }

    function randomColor(alpha) {
        return 'rgba(' + [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] + ')';
    }

    function putBeatsOnWavesurfer() {
        for (var k in beatdata) {
            //console.log(beats.results.bindings[k].beatAt);
            var r = wavesurfer.addRegion({
                color: 'rgba(255, 100, 0, 0.5)',
                start: beatdata[k],
                end: beatdata[k] + 0.025,
                resize: false,
                drag: false
            });
            r.type = 'beat-grid-marker';
            r.order = k;
        }
    }

    function nudgeBeatGrid (timevar) {
        //TODO
    }

    function populateBeatsTable(beats) {
        //TODO
    }

    function populateSongInfoPanel(info) {
        //TODO
    }

    /**
     *  {
     *      values:[lo,hi],
     *      indexes: [lo_i,hi_i]
     *  }
     */
    function getClosestValues(a, x) {
        var lo, hi;
        var lo_i, hi_i;
        for (var i = a.length; i--;) {
            if (a[i] <= x && (lo === undefined || lo < a[i])) {
                lo = a[i];
                lo_i = i;
            }
                
            if (a[i] >= x && (hi === undefined || hi > a[i])) {
                hi = a[i];
                hi_i = i;
            }
        };
        return { values:[lo, hi], indexes:[lo_i,hi_i]};
    }

    function align_time_to_grid(grid,time) {
        var r = getClosestValues(grid,time);
        var a = Math.abs(time-r.values[0]);
        var b = Math.abs(time-r.values[1]);

        if (a > b)
            return r.values[0];
        else 
            return r.values[1];
    }

    function repair_if_needed(grid, vals_indx, step) {
        if (vals_indx.values[0] && vals_indx.values[1]) {
            return vals_indx;
        } else if (vals_indx.values[0]==undefined) {
            var aux = {values:[0,0],indexes:[0,0]};
            aux.values[0] = vals_indx.values[1];
            aux.indexes[0] = vals_indx.indexes[1];
            aux.values[1] = grid[step];
            aux.indexes[1] = step;
            return aux;
        } else {
            /*
            TODO
            var aux = {values:[0,0],indexes:[0,0]};
            aux.values[0] = grid[grid.length-1-step];
            aux.indexes[0] = vals_indx.indexes[1];
            aux.values[1] = grid[step];
            aux.indexes[1] = step;
            */
        }

    }

    function clearWavesurferSegments() {
        var regions = wavesurfer.regions.list;
        Object.keys(regions).forEach(function (rid) {
            if(!rid)
                return;
            if (regions[rid].type!='beat-grid-marker')
                regions[rid].remove();
        });
    }



    function loadAnnotationsOnWavesurfer(annTrackId) {
        dataServer.getAllTrackAnnotations(annTrackId, function(err,anns) {
            anns.forEach(function(ann) {
                var r = wavesurfer.addRegion({
                    color: ann.color,
                    start: ann.start,
                    alpha: 0.5,
                    end: ann.end,
                    resize: true,
                    drag: true
                });
                r.annotation = {};
                r.annotation.id = ann._id;
                r.annotation.trackId = ann.trackId;
            });
        });
    }



    function mylog(x,y) {
        console.log(x);
        console.log(y);
    }



    function addWavesurferEventHandlers() {

        wavesurfer.on('region-in', wavesurfer_region_in_handler);

        wavesurfer.on('region-out', wavesurfer_region_out_handler);

        wavesurfer.on('region-dblclick', wavesurfer_dbl_click_handler);

        wavesurfer.on('scroll', wavesurfer_scroll_handler);

        wavesurfer.on('region-click', wavesurfer_region_click_handler);

        wavesurfer.on('region-created', wavesurfer_region_created_handler);

        wavesurfer.on('region-update-end', wavesurfer_region_update_end_handler);

        wavesurfer.on('region-drag-creation-end', wavesurfer_region_drag_creation_end_handler);

        wavesurfer.on('region-updated',wavesurfer_region_updated_handler);
    }

    

    function wavesurfer_region_drag_creation_end_handler(e) {
        var new_start           =   e.start;
        var new_end             =   e.end;

        if (snapToGrid) {
            new_start   =   align_time_to_grid(beatdata,e.start);
            new_end     =   align_time_to_grid(beatdata,e.end);
        }

        var trackIdBeingShown = $('#track-selector-list').val();
        if (trackIdBeingShown!=-1) {
            dataServer.createAnnotation({
                musicId: musicId,
                trackId: trackIdBeingShown, 
                start: new_start,
                end: new_end,
                user: dataServer.getUsername()
            });
            //TODO: add new annotation to track UI
        }
    }

    function wavesurfer_region_updated_handler(e) {
        if (!snapToGrid) return;

        if (new_start == 0)
            return;

        wavesurfer.un('region-updated',wavesurfer_region_updated_handler);

        var new_start           =   e.start;
        var new_end             =   e.end;

        if (snapToGrid) {
            new_start   =   align_time_to_grid(beatdata,e.start);
            new_end     =   align_time_to_grid(beatdata,e.end);
        }
        

        if (logging_details.regions.dragSelection) {
            console.log("----------");
            console.log('region-updated');
            console.log(e);
            console.log("new start: " + new_start);
            console.log("new end: " + new_end);
            console.log("----------");
        }

        e.update({
            start: new_start,
            end: new_end
        });

        wavesurfer.on('region-updated',wavesurfer_region_updated_handler);
    }

    function wavesurfer_region_update_end_handler(e) {
        var new_start           =   e.start;
        var new_end             =   e.end;

        if (snapToGrid) {
            new_start   =   align_time_to_grid(beatdata,e.start);
            new_end     =   align_time_to_grid(beatdata,e.end);
        }

        var trackId = $('#track-selector-list').val();
        var savedTrackShown = trackId != -1;
        if (savedTrackShown) {
            dataServer.updateAnnotation({
                _id: e.annotation.id,
                start: new_start, 
                end: new_end
            }, function(err,resp){
                if (!err)
                    annBoard.refreshAnnotation(resp);
                else
                    console.log(err);
            });
        }
    }

    function wavesurfer_region_created_handler(e) {
        console.log('------');
        console.log('wavesurfer.js region-created');
        console.log(e);
        console.log('------');
    }

    function wavesurfer_region_click_handler(e) {
        console.log('------');
        console.log('wavesurfer.js region-click');
        console.log(e);
        console.log('------');
    }

    function wavesurfer_scroll_handler(e) {

        annBoard.scrollAnnotationsTracks(e.target);
    }

    function wavesurfer_dbl_click_handler(e) {

        annotationDialog(e.annotation.id);
    }

    function wavesurfer_region_in_handler(e) {
        // if (e.type=='beat-grid-marker' && metronomeActive)
        //     gain.connect(context.destination);
        
        //update cursor position in the board
        if (e.type=='beat-grid-marker')
            annBoard.setCursorsPosition(e.start);
    }

    function wavesurfer_region_out_handler(e) {
        if (e.type=='beat-grid-marker')
            gain.disconnect();
    }


var controlsHTML = 
["<button id='add-track' class='btn btn-default' onclick='addTrack()'>",
"                    Add new annotation track",
"</button>",
"<button class='btn btn-primary' data-action='back'>",
"    <i class='glyphicon glyphicon-step-backward'></i>",
"    Backward",
"</button>",
"<button class='btn btn-primary' data-action='play'>",
"    <i class='glyphicon glyphicon-play'></i>",
"    Play",
"    /",
"    <i class='glyphicon glyphicon-pause'></i>",
"    Pause",
"</button>",
"<button class='btn btn-primary' data-action='forth'>",
"    <i class='glyphicon glyphicon-step-forward'></i>",
"    Forward",
"</button>",
"<button class='btn btn-primary' data-action='toggle-mute'>",
"    <i class='glyphicon glyphicon-volume-off'></i>",
"    Toggle Mute",
"</button>",
"",
"<div class='checkbox'>",
"    <label>",
"        <input data-action='toggle-region-creation-on-drag' type='checkbox'> Drag to create",
"    </label>",
"</div>",
"<div class='checkbox'>",
"    <label>",
"        <input data-action='toggle-snap-to-grid' type='checkbox'> Snap to grid",
"    </label>",
"</div>",
"<label for='disabledSelect'>",
"    Select Annotation Track",
"</label>",
"<select id='track-selector-list' class='form-control' data-action='track-selected-to-sync'>",
"    <option value='-1'>None</option>",
"</select>"].join("\n");