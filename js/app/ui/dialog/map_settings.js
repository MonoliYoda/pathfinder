/**
 *  map settings dialogs
 */

define([
    'jquery',
    'app/init',
    'app/util',
    'app/render',
    'bootbox',
    'app/map/util',
    'app/module_map',
    'app/map/overlay/util',
], ($, Init, Util, Render, bootbox, MapUtil, ModuleMap, MapOverlayUtil) => {
    'use strict';

    let config = {
        // map dialog
        newMapDialogId: 'pf-map-dialog',                                                // id for map settings dialog
        dialogMapNewContainerId: 'pf-map-dialog-new',                                   // id for the "new map" container
        dialogMapEditContainerId: 'pf-map-dialog-edit',                                 // id for the "edit" container
        dialogMapSettingsContainerId: 'pf-map-dialog-settings',                         // id for the "settings" container
        dialogMapDownloadContainerId: 'pf-map-dialog-download',                         // id for the "download" container

        // new map form
        newNameInputId: 'pf-map-dialog-new-name-input',                                 // id for "name" input
        newIconSelectId: 'pf-map-dialog-new-icon-select',                               // id for "icon" select
        newScopeSelectId: 'pf-map-dialog-new-scope-select',                             // id for "scope" select
        newTypeSelectId: 'pf-map-dialog-new-type-select',                               // id for "type" select

        // edit map form
        editNameInputId: 'pf-map-dialog-edit-name-input',                               // id for "name" input
        editIconSelectId: 'pf-map-dialog-edit-icon-select',                             // id for "icon" select
        editScopeSelectId: 'pf-map-dialog-edit-scope-select',                           // id for "scope" select
        editTypeSelectId: 'pf-map-dialog-edit-type-select',                             // id for "type" select

        // settings map form
        deleteExpiredConnectionsId: 'pf-map-dialog-delete-connections-expired',         // id for "deleteExpiredConnections" checkbox
        deleteEolConnectionsId: 'pf-map-dialog-delete-connections-eol',                 // id for "deleteEOLConnections" checkbox
        persistentAliasesId: 'pf-map-dialog-persistent-aliases',                        // id for "persistentAliases" checkbox
        persistentSignaturesId: 'pf-map-dialog-persistent-signatures',                  // id for "persistentSignatures" checkbox
        trackAbyssalJumpsId: 'pf-map-dialog-track-abyss-jumps',                         // id for "trackAbyssalJumps" checkbox

        logHistoryId: 'pf-map-dialog-history',                                          // id for "history logging" checkbox
        logActivityId: 'pf-map-dialog-activity',                                        // id for "activity" checkbox

        slackWebHookURLId: 'pf-map-dialog-slack-url',                                   // id for Slack "webHookUrl"
        slackUsernameId: 'pf-map-dialog-slack-username',                                // id for Slack "username"
        slackIconId: 'pf-map-dialog-slack-icon',                                        // id for Slack "icon"
        slackChannelHistoryId: 'pf-map-dialog-slack-channel-history',                   // id for Slack channel "history"
        slackChannelRallyId: 'pf-map-dialog-slack-channel-rally',                       // id for Slack channel "rally"

        discordUsernameId: 'pf-map-dialog-discord-username',                            // id for Discord "username"
        discordWebHookURLRallyId: 'pf-map-dialog-discord-url-rally',                    // id for Discord "rally" webHookUrl
        discordWebHookURLHistoryId: 'pf-map-dialog-discord-url-history',                // id for Discord "history" webHookUrl

        characterSelectId: 'pf-map-dialog-character-select',                            // id for "character" select
        corporationSelectId: 'pf-map-dialog-corporation-select',                        // id for "corporation" select
        allianceSelectId: 'pf-map-dialog-alliance-select',                              // id for "alliance" select

        dialogMapExportFormId: 'pf-map-dialog-form-export',                             // id for "export" form
        dialogMapImportFormId: 'pf-map-dialog-form-import',                             // id for "import" form

        buttonExportId: 'pf-map-dialog-button-export',                                  // id for "export" button
        buttonImportId: 'pf-map-dialog-button-import',                                  // id for "import" button

        fieldExportId: 'pf-map-filename-export',                                        // id for "export" filename field
        fieldImportId: 'pf-map-filename-import',                                        // id for "import" filename field
        dialogMapImportInfoId: 'pf-map-import-container',                               // id for "info" container
        dragDropElementClass: 'pf-form-dropzone'                                        // class for "drag&drop" zone
    };

    /**
     * format a given string into a valid filename
     * @param filename
     * @returns {string}
     */
    let formatFilename = function(filename){
        filename = filename.replace(/[^a-zA-Z0-9]/g,'_');

        let nowDate = new Date();
        let filenameDate = nowDate.toISOString().slice(0,10).replace(/-/g, '_');

        return  (filename + '_' + filenameDate).replace(/__/g,'_');
    };

    /**
     * shows the add/edit map dialog
     * @param mapData
     * @param options
     */
    $.fn.showMapSettingsDialog = function(mapData, options){

        // check if dialog is already open
        let mapInfoDialogElement = $('#' + config.newMapDialogId);
        if(!mapInfoDialogElement.is(':visible')){

            requirejs([
                'text!templates/dialog/map.html',
                'text!templates/form/map.html',
                'mustache'
            ], (templateMapDialog, templateMapForm, Mustache) => {
                let selectOption = value => () => (val, render) => {
                    if(render(val) === String(value)){
                        return 'selected';
                    }
                };

                let dialogTitle = 'Map settings';

                // if there are no maps -> hide settings tab
                let hideEditTab = mapData === false;
                let hideSettingsTab = mapData === false;
                let hideDownloadTab = mapData === false;

                let hasRightMapCreate = true;
                let hasRightMapUpdate = MapUtil ? MapUtil.checkRight('map_update', mapData.config) : true;
                let hasRightMapExport = MapUtil ? MapUtil.checkRight('map_export', mapData.config) : true;
                let hasRightMapImport = MapUtil ? MapUtil.checkRight('map_import', mapData.config) : true;
                let hasRightMapShare  = MapUtil ? MapUtil.checkRight('map_share', mapData.config)  : true;

                // available map "type" options data
                // -> for "new" map tab
                let mapTypesCreate = MapUtil.getMapTypes(true, 'map_create');
                // -> for "edit" map tab
                let mapTypesUpdate = MapUtil.getMapTypes(true, 'map_update');

                // render main dialog ---------------------------------------------------------------------------------
                let mapDialogData = {
                    id: config.newMapDialogId,
                    mapData: mapData,
                    type: mapTypesCreate,
                    select2Class: Util.config.select2Class,

                    hasRightMapUpdate,
                    hasRightMapExport,
                    hasRightMapImport,
                    hasRightMapShare,

                    // message container
                    formErrorContainerClass: Util.config.formErrorContainerClass,
                    formWarningContainerClass: Util.config.formWarningContainerClass,
                    formInfoContainerClass: Util.config.formInfoContainerClass,

                    // default open tab ----------
                    openTabNew: options.tab === 'new',
                    openTabEdit: options.tab === 'edit',
                    openTabSettings: options.tab === 'settings',
                    openTabDownload: options.tab === 'download',

                    dialogMapNewContainerId: config.dialogMapNewContainerId,
                    dialogMapEditContainerId: config.dialogMapEditContainerId,
                    dialogMapSettingsContainerId: config.dialogMapSettingsContainerId,
                    dialogMapDownloadContainerId: config.dialogMapDownloadContainerId,

                    hideEditTab,
                    hideSettingsTab,
                    hideDownloadTab,

                    // settings tab --------------
                    deleteExpiredConnectionsId : config.deleteExpiredConnectionsId,
                    deleteEolConnectionsId : config.deleteEolConnectionsId,
                    persistentAliasesId : config.persistentAliasesId,
                    persistentSignaturesId : config.persistentSignaturesId,
                    trackAbyssalJumpsId : config.trackAbyssalJumpsId,
                    logHistoryId: config.logHistoryId,
                    logActivityId: config.logActivityId,

                    deleteExpiredConnections: true,
                    deleteEolConnections: true,
                    persistentAliases: true,
                    persistentSignatures: true,
                    trackAbyssalJumps: false,
                    logActivity: true,
                    logHistory: true,

                    slackWebHookURLId: config.slackWebHookURLId,
                    slackUsernameId: config.slackUsernameId,
                    slackIconId: config.slackIconId,
                    slackChannelHistoryId: config.slackChannelHistoryId,
                    slackChannelRallyId: config.slackChannelRallyId,

                    slackWebHookURL: '',
                    slackUsername: '',
                    slackIcon: '',
                    slackChannelHistory: '',
                    slackChannelRally: '',
                    slackEnabled: false,
                    slackHistoryEnabled: false,
                    slackRallyEnabled: false,
                    slackSectionShow: false,

                    discordUsernameId: config.discordUsernameId,
                    discordWebHookURLRallyId: config.discordWebHookURLRallyId,
                    discordWebHookURLHistoryId: config.discordWebHookURLHistoryId,

                    discordUsername: '',
                    discordWebHookURLRally: '',
                    discordWebHookURLHistory: '',
                    discordEnabled: false,
                    discordRallyEnabled: false,
                    discordHistoryEnabled: false,
                    discordSectionShow: false,

                    // map access ----------------
                    characterSelectId: config.characterSelectId,
                    corporationSelectId: config.corporationSelectId,
                    allianceSelectId: config.allianceSelectId,

                    // access limitations --------
                    maxCharacter: Init.mapTypes.private.defaultConfig.max_shared,
                    maxCorporation: Init.mapTypes.corporation.defaultConfig.max_shared,
                    maxAlliance: Init.mapTypes.alliance.defaultConfig.max_shared,

                    accessCharacter: [],
                    accessCorporation: [],
                    accessAlliance: [],

                    // download tab --------------
                    dialogMapExportFormId: config.dialogMapExportFormId,
                    dialogMapImportFormId: config.dialogMapImportFormId,
                    buttonExportId: config.buttonExportId,
                    buttonImportId: config.buttonImportId,
                    fieldExportId: config.fieldExportId,
                    fieldImportId: config.fieldImportId,
                    dialogMapImportInfoId: config.dialogMapImportInfoId,

                    formatFilename: () => (mapName, render) => formatFilename(render(mapName))
                };

                if(mapData !== false){
                    Object.assign(mapDialogData, {
                        deleteExpiredConnections: mapData.config.deleteExpiredConnections,
                        deleteEolConnections: mapData.config.deleteEolConnections,
                        persistentAliases: mapData.config.persistentAliases,
                        persistentSignatures: mapData.config.persistentSignatures,
                        trackAbyssalJumps: mapData.config.trackAbyssalJumps,
                        logActivity: mapData.config.logging.activity,
                        logHistory: mapData.config.logging.history,

                        slackWebHookURL: mapData.config.logging.slackWebHookURL,
                        slackUsername: mapData.config.logging.slackUsername,
                        slackIcon: mapData.config.logging.slackIcon,
                        slackChannelHistory: mapData.config.logging.slackChannelHistory,
                        slackChannelRally: mapData.config.logging.slackChannelRally,
                        slackEnabled: Boolean(Util.getObjVal(Init, 'slack.status')),

                        discordUsername: Util.getObjVal(mapData, 'config.logging.discordUsername'),
                        discordWebHookURLRally: Util.getObjVal(mapData, 'config.logging.discordWebHookURLRally'),
                        discordWebHookURLHistory: Util.getObjVal(mapData, 'config.logging.discordWebHookURLHistory'),
                        discordEnabled: Boolean(Util.getObjVal(Init, 'discord.status')),

                        accessCharacter: mapData.config.access.character,
                        accessCorporation: mapData.config.access.corporation,
                        accessAlliance: mapData.config.access.alliance
                    });

                    Object.assign(mapDialogData, {
                        // remove "#" from Slack channels
                        slackChannelHistory: mapDialogData.slackChannelHistory.indexOf('#') === 0 ? mapDialogData.slackChannelHistory.substr(1) : mapDialogData.slackChannelHistory,
                        slackChannelRally: mapDialogData.slackChannelRally.indexOf('#') === 0 ? mapDialogData.slackChannelRally.substr(1) : mapDialogData.slackChannelRally,

                        slackHistoryEnabled: mapDialogData.slackEnabled && Boolean(Util.getObjVal(Init.mapTypes, mapData.config.type.name + '.defaultConfig.send_history_slack_enabled')),
                        slackRallyEnabled: mapDialogData.slackEnabled && Boolean(Util.getObjVal(Init.mapTypes, mapData.config.type.name + '.defaultConfig.send_rally_slack_enabled')),
                        slackSectionShow: (mapDialogData.slackEnabled && mapDialogData.slackWebHookURL.length > 0),

                        discordRallyEnabled: mapDialogData.discordEnabled && Boolean(Util.getObjVal(Init.mapTypes, mapData.config.type.name + '.defaultConfig.send_rally_discord_enabled')),
                        discordHistoryEnabled: mapDialogData.discordEnabled && Boolean(Util.getObjVal(Init.mapTypes, mapData.config.type.name + '.defaultConfig.send_history_discord_enabled')),
                        discordSectionShow: (mapDialogData.discordEnabled && (mapDialogData.discordWebHookURLRally.length > 0 || mapDialogData.discordWebHookURLHistory.length > 0)),
                    });
                }

                let contentDialog = Mustache.render(templateMapDialog, mapDialogData);
                contentDialog = $(contentDialog);

                // "new map" + "edit map" tab base --------------------------------------------------------------------
                let mapFormData = {
                    select2Class: Util.config.select2Class,
                    scope: MapUtil.getMapScopes(),
                    icon: MapUtil.getMapIcons(),
                    formErrorContainerClass: Util.config.formErrorContainerClass,
                    formWarningContainerClass: Util.config.formWarningContainerClass,
                    formInfoContainerClass: Util.config.formInfoContainerClass
                };

                // render "new map" tab content -----------------------------------------------------------------------
                let mapFormDataNew = Object.assign({}, mapFormData, {
                    type: mapTypesCreate,
                    hasRightMapForm: hasRightMapCreate,
                    nameInputId: config.newNameInputId,
                    iconSelectId: config.newIconSelectId,
                    scopeSelectId: config.newScopeSelectId,
                    typeSelectId: config.newTypeSelectId,

                    mapId: 0,
                    mapIcon: undefined,
                    mapName: undefined,
                    mapScopeId: undefined,
                    mapTypeId: undefined
                });
                let contentNewMap = Mustache.render(templateMapForm, mapFormDataNew);
                $('#' + config.dialogMapNewContainerId, contentDialog).html(contentNewMap);

                // render "edit map" tab content ----------------------------------------------------------------------
                if(!hideEditTab){
                    let mapFormDataEdit = Object.assign({}, mapFormData, {
                        type: mapTypesUpdate,
                        hasRightMapForm: hasRightMapUpdate,
                        nameInputId: config.editNameInputId,
                        iconSelectId: config.editIconSelectId,
                        scopeSelectId: config.editScopeSelectId,
                        typeSelectId: config.editTypeSelectId,

                        mapId: mapData.config.id,
                        mapIcon: selectOption(mapData.config.icon),
                        mapName: mapData.config.name,
                        mapScopeId: selectOption(mapData.config.scope.id),
                        mapTypeId: selectOption(mapData.config.type.id)
                    });
                    let contentEditMap = Mustache.render(templateMapForm, mapFormDataEdit);
                    $('#' + config.dialogMapEditContainerId, contentDialog).html(contentEditMap);
                }

                let mapInfoDialog = bootbox.dialog({
                    title: dialogTitle,
                    message: contentDialog,
                    buttons: {
                        close: {
                            label: 'cancel',
                            className: 'btn-default'
                        },
                        success: {
                            label: '<i class="fas fa-check fa-fw"></i>&nbsp;save',
                            className: 'btn-success',
                            callback: function(){
                                // get the current active form
                                let form = $('#' + config.newMapDialogId).find('form').filter(':visible');

                                // validate form
                                form.validator('validate');

                                // validate select2 fields (settings tab)
                                form.find('select').each(function(){
                                    let selectField = $(this);
                                    let selectValues = selectField.val();

                                    if(selectValues && selectValues.length > 0){
                                        selectField.parents('.form-group').removeClass('has-error');
                                    }else{
                                        selectField.parents('.form-group').addClass('has-error');
                                    }
                                });

                                // check whether the form is valid
                                if(form.isValidForm()){
                                    // lock dialog
                                    let dialogContent = mapInfoDialog.find('.modal-content');
                                    dialogContent.showLoadingAnimation();

                                    // get form data
                                    let formData = form.getFormValues();

                                    // add value prefixes (Slack channels)
                                    Object.keys(formData).map((key, index) => {
                                        if(['slackChannelHistory', 'slackChannelRally'].includes(key))
                                            formData[key] = (formData[key].length ? '#' : '') + formData[key];
                                    });

                                    if(mapData){
                                        // no map data found -> probably new user
                                        MapOverlayUtil.getMapOverlay(mapData.map.getContainer(), 'timer').startMapUpdateCounter();
                                    }

                                    let method = formData.id ? 'PATCH' : 'PUT';

                                    Util.request(method, 'Map', formData.id, formData, {
                                        formElement: form // for error form messages
                                    }, context => {
                                        // always do
                                        dialogContent.hideLoadingAnimation();
                                    }).then(
                                        payload => {
                                            let mapData = Util.getObjVal(payload, 'data.mapData');
                                            Util.showNotify({title: dialogTitle, text: `Map: ${Util.getObjVal(mapData, 'name')}`, type: 'success'});

                                            // update map-tab Element
                                            let tabLinkEls = Util.getMapTabLinkElements(Util.getMapModule()[0], Util.getObjVal(mapData, 'id'));
                                            if(tabLinkEls.length === 1){
                                                ModuleMap.updateTabData(tabLinkEls[0], mapData);
                                            }

                                            $(mapInfoDialog).modal('hide');
                                            Util.triggerMenuAction(document, 'Close');
                                        },
                                        Util.handleAjaxErrorResponse
                                    );
                                }

                                return false;
                            }
                        }
                    }
                });

                // after modal is shown ===============================================================================
                mapInfoDialog.on('shown.bs.modal', function(e){
                    mapInfoDialog.initTooltips();

                    // manually trigger the "show" event for the initial active tab (not triggered by default...)
                    mapInfoDialog.find('.navbar li.active a[data-toggle=tab]').trigger('shown.bs.tab');

                    // prevent "disabled" tabs from being clicked... "bootstrap" bugFix...
                    mapInfoDialog.find('.navbar a[data-toggle=tab]').on('click', function(e){
                        if($(this).hasClass('disabled')){
                            e.preventDefault();
                            return false;
                        }
                    });

                    // make <select>s to Select2 fields
                    mapInfoDialog.find(
                        '#' + config.dialogMapNewContainerId + ' .' + Util.config.select2Class + ', ' +
                        '#' + config.dialogMapEditContainerId + ' .' + Util.config.select2Class + ', ' +
                        '#' + config.dialogMapDownloadContainerId + ' .' + Util.config.select2Class
                    ).select2({
                        minimumResultsForSearch: -1,
                        width: '100%'
                    });

                    // set form validator
                    mapInfoDialog.find('form').initFormValidation();

                    // show form messages -------------------------------------
                    // get current active form(tab)
                    let form = $('#' + config.newMapDialogId).find('form').filter(':visible');

                    form.showFormMessage([{type: 'info', text: 'Creating new maps or change settings may take a few seconds'}]);

                    if(!mapData){
                        // no map data found -> probably new user
                        form.showFormMessage([{type: 'warning', text: 'No maps found. Create a new map before you can start'}]);
                    }

                    // init "download tab" ============================================================================
                    let downloadTabElement = mapInfoDialog.find('#' + config.dialogMapDownloadContainerId);
                    if(downloadTabElement.length){
                        // tab exists

                        // export map data ----------------------------------------------------------------------------
                        downloadTabElement.find('#' + config.buttonExportId).on('click', {mapData}, function(e){

                            let exportForm = $('#' + config.dialogMapExportFormId);
                            let validExportForm = exportForm.isValidForm();

                            if(validExportForm){
                                let mapElement = Util.getMapModule().getActiveMap();

                                if(mapElement){
                                    // IMPORTANT: Get map data from client (NOT from global mapData which is available in here)
                                    // -> This excludes some data (e.g. wh statics)
                                    // -> Bring export inline with main map toggle requests
                                    let exportMapData = mapElement.getMapDataFromClient(['hasId']);

                                    let exportButton = $(this);
                                    // set map data right before download
                                    setExportMapData(exportButton, exportMapData);

                                    // disable button
                                    exportButton.attr('disabled', true);
                                }else{
                                    console.error('Map not found');
                                }
                            }else{
                                e.preventDefault();
                            }
                        });

                        // import map data ----------------------------------------------------------------------------
                        // check if "FileReader" API is supported
                        let importFormElement = downloadTabElement.find('#' + config.dialogMapImportFormId);
                        if(window.File && window.FileReader && window.FileList && window.Blob){

                            // show file info in UI
                            downloadTabElement.find('#' + config.fieldImportId).on('change', function(e){
                                e.stopPropagation();
                                e.preventDefault();

                                let infoContainerElement = importFormElement.find('#' + config.dialogMapImportInfoId);
                                infoContainerElement.hide().empty();
                                importFormElement.hideFormMessage('all');

                                let output = [];
                                let files = e.target.files;

                                for(let i = 0, f; !!(f = files[i]); i++){
                                    output.push(( i + 1 ) + '. file: ' + f.name + ' - ' +
                                        f.size + ' bytes; last modified: ' +
                                        f.lastModifiedDate.toLocaleDateString() );
                                }

                                if(output.length > 0){
                                    infoContainerElement.html( output ).show();
                                }

                                importFormElement.validator('validate');
                            });

                            // drag&drop
                            let importData = {};
                            importData.mapData = [];
                            let files = [];
                            let filesCount = 0;
                            let filesCountFail = 0;

                            // onLoad for FileReader API
                            let readerOnLoad = function(readEvent){

                                // get file content
                                try{
                                    importData.mapData.push( JSON.parse( readEvent.target.result ) );
                                }catch(error){
                                    filesCountFail++;
                                    importFormElement.showFormMessage([{type: 'error', text: 'File can not be parsed'}]);
                                }

                                // start import when all files are parsed
                                if(
                                    filesCount === files.length &&
                                    filesCountFail === 0
                                ){
                                    importMaps(importData, () => {
                                        mapInfoDialog.modal('hide');
                                    });
                                }
                            };

                            let handleDragOver = function(dragEvent){
                                dragEvent.stopPropagation();
                                dragEvent.preventDefault();
                                dragEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
                            };

                            let handleFileSelect = function(evt){
                                evt.stopPropagation();
                                evt.preventDefault();

                                importData = importFormElement.getFormValues();
                                importData.mapData = [];
                                filesCount = 0;
                                filesCountFail = 0;

                                files = evt.dataTransfer.files; // FileList object.

                                for(let file; !!(file = files[filesCount]); filesCount++){
                                    let reader = new FileReader();
                                    reader.onload = readerOnLoad;
                                    reader.readAsText(file);
                                }
                            };

                            let dropZone = downloadTabElement.find('.' + config.dragDropElementClass);
                            if(dropZone.length){
                                dropZone[0].addEventListener('dragover', handleDragOver, false);
                                dropZone[0].addEventListener('drop', handleFileSelect, false);
                            }

                            // import "button"
                            downloadTabElement.find('#' + config.buttonImportId).on('click', function(e){

                                importFormElement.validator('validate');
                                let validImportForm = importFormElement.isValidForm();

                                if(validImportForm){
                                    importData = importFormElement.getFormValues();
                                    importData.mapData = [];

                                    let fileElement = downloadTabElement.find('#' + config.fieldImportId);
                                    files = fileElement[0].files;
                                    filesCount = 0;
                                    filesCountFail = 0;

                                    for(let file; !!(file = files[filesCount]); filesCount++){
                                        let reader = new FileReader();
                                        reader.onload = readerOnLoad;
                                        reader.readAsText(file);
                                    }
                                }
                            });
                        }else{
                            importFormElement.showFormMessage([{type: 'error', text: 'The File APIs are not fully supported in this browser.'}]);
                        }
                    }
                });

                // events for tab change ------------------------------------------------------------------------------
                mapInfoDialog.find('.navbar a').on('shown.bs.tab', function(e){
                    let modalDialog = mapInfoDialog.find('div.modal-dialog');
                    let tabContentId = $(e.target).attr('href');
                    let tabContentForms = $(tabContentId).find('form.form-horizontal');
                    let selectElementCharacter = mapInfoDialog.find('#' + config.characterSelectId);
                    let selectElementCorporation = mapInfoDialog.find('#' + config.corporationSelectId);
                    let selectElementAlliance = mapInfoDialog.find('#' + config.allianceSelectId);

                    if(tabContentId === '#' + config.dialogMapSettingsContainerId){
                        // "settings" tab -> resize modal
                        modalDialog.toggleClass('modal-lg', true);
                        initSettingsSelectFields(mapInfoDialog);
                    }else{
                        // resize modal
                        modalDialog.toggleClass('modal-lg', false);

                        if( $(selectElementCharacter).data('select2') !== undefined ){
                            $(selectElementCharacter).select2('destroy');
                        }

                        if( $(selectElementCorporation).data('select2') !== undefined ){
                            $(selectElementCorporation).select2('destroy');
                        }

                        if( $(selectElementAlliance).data('select2') !== undefined ){
                            $(selectElementAlliance).select2('destroy');
                        }
                    }

                    // no "save" dialog  button on "in/export" tab
                    if(
                        tabContentId === '#' + config.dialogMapDownloadContainerId || // no "save" dialog  button on "in/export" tab
                        !tabContentForms.length // no <form> in tab (e.g. restricted by missing right)
                    ){
                        mapInfoDialog.find('button.btn-success').hide();
                    }else{
                        mapInfoDialog.find('button.btn-success').show();
                    }
                });
            });
        }
    };

    /**
     * import new map(s) data
     * @param importData
     * @param callback
     */
    let importMaps = (importData, callback) => {
        let importForm = $('#' + config.dialogMapImportFormId);
        importForm.hideFormMessage('all');

        // lock dialog
        let dialogContent = importForm.parents('.modal-content');
        dialogContent.showLoadingAnimation();

        $.ajax({
            type: 'POST',
            url: Init.path.importMap,
            data: importData,
            dataType: 'json'
        }).done(function(responseData){
            if(responseData.error.length){
                //   form.showFormMessage(responseData.error);
                importForm.showFormMessage(responseData.error);
            }else{
                // success
                if(responseData.warning.length){
                    importForm.showFormMessage(responseData.warning);
                }

                if(callback){
                    callback();
                }

                Util.showNotify({title: 'Import finished', text: 'Map(s) imported', type: 'success'});
            }
        }).fail(function(jqXHR, status, error){
            let reason = status + ' ' + error;
            Util.showNotify({title: jqXHR.status + ': importMap', text: reason, type: 'error'});
        }).always(function(){
            importForm.find('input, select').resetFormFields().trigger('change');
            dialogContent.hideLoadingAnimation();
        });
    };

    /**
     * set json map data for export to an element (e.g. <a>-Tag or button) for download
     * @param element
     * @param mapData
     */
    let setExportMapData = (element, mapData) => {

        let fieldExport = $('#' + config.fieldExportId);
        let filename = '';
        let mapDataEncoded = '';

        if(fieldExport.length){
            filename = fieldExport.val();

            if(filename.length > 0){
                mapDataEncoded = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify( mapData ));
            }
        }

        element.attr('href', 'data:' + mapDataEncoded);
        element.attr('download', filename + '.json');
    };

    /**
     * init select2 fields within the settings dialog
     * @param mapInfoDialog
     */
    let initSettingsSelectFields = mapInfoDialog => {

        let selectElementCharacter = mapInfoDialog.find('#' + config.characterSelectId);
        let selectElementCorporation = mapInfoDialog.find('#' + config.corporationSelectId);
        let selectElementAlliance = mapInfoDialog.find('#' + config.allianceSelectId);

        // init character select live search
        selectElementCharacter.initAccessSelect({
            type: 'character',
            maxSelectionLength: Init.mapTypes.private.defaultConfig.max_shared
        });

        // init corporation select live search
        selectElementCorporation.initAccessSelect({
            type: 'corporation',
            maxSelectionLength: Init.mapTypes.corporation.defaultConfig.max_shared
        });

        // init alliance select live search
        selectElementAlliance.initAccessSelect({
            type: 'alliance',
            maxSelectionLength: Init.mapTypes.alliance.defaultConfig.max_shared
        });
    };

    /**
     * shows the delete map Dialog
     * @param mapData
     */
    $.fn.showDeleteMapDialog = function(mapData){
        let mapId = Util.getObjVal(mapData, 'config.id');
        let mapName = Util.getObjVal(mapData, 'config.name');
        if(!mapId) return;

        let mapNameStr = `<span class="txt-color txt-color-danger">${mapName}</span>`;

        let mapDeleteDialog = bootbox.confirm({
            message: `Delete map "${mapNameStr}"?`,
            buttons: {
                confirm: {
                    label: '<i class="fas fa-trash fa-fw"></i>&nbsp;delete map',
                    className: 'btn-danger'
                }
            },
            callback: result => {
                if(result){
                    // lock dialog
                    let dialogContent = mapDeleteDialog.find('.modal-content');
                    dialogContent.showLoadingAnimation();

                    Util.request('DELETE', 'Map', mapId, {}, {}).then(
                        payload => {
                            Util.showNotify({title: 'Map deleted', text: 'Map: ' + mapName, type: 'success'});
                        },
                        Util.handleAjaxErrorResponse
                    ).finally(() => mapDeleteDialog.modal('hide'));

                    return false;
                }
            }
        });

    };

});
