/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */

define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log', './commonCustFolderApi.js'], 
function(encode, file, search, format, config, record, email, render, runtime, log, custfolder) {
    function getInputData(context){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }

    function map(context){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }
    
    function reduce(context){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }

    function summarize(context){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }

    //#region customize function
    function runExcel(context, scriptObj, folderId){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }

    function writeXmlDetailData(detail, xmlString, currency){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }

    function getInvoiceData(tranid){
        try{

        }catch(e){
            log.debug(e.name, e.message)
        }
    }
    //#endregion

    return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};
});