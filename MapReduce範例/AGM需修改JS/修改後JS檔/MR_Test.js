/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */

define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log', './commonCustFolderApi.js'], 
function(encode, file, search, format, config, record, email, render, runtime, log, custfolder) {
    function getInputData(context){
        try{
            var scriptObj = runtime.getCurrentScript();
			
			var currentUser = runtime.getCurrentUser().id; 	

            var rgd01 = scriptObj.getParameter({
                name: 'rgd01'
            });

            var rgd02 = scriptObj.getParameter({
                name: 'rgd02'
            });

            var rgd03 = scriptObj.getParameter({
                name: 'rgd03'
            });

            var rgd04 = scriptObj.getParameter({
                name: 'rgd04'
            });

            var rgd05 = scriptObj.getParameter({
                name: 'rgd05'
            });

            
        }catch(e){
            log.debug(e.name, e.message)
        }
    }

    function map(context){
        try{
            //↓↓↓ 預設稅籍編號 -------------------
				var SearObjRegNo = search.create({
                    type: "customrecord_ev_registrations_all",
                    //filters:[["custrecord_18_default_regno","is","true"]], //僅抓取預設稅籍編號
                    filters:[], 
                    columns:[
                       search.createColumn({name: "name", label: "Name"}), //稅籍編號
                       search.createColumn({name: "custrecord_18_site_uniform_number", label: "統一編號"}),
                       search.createColumn({name: "custrecord_18_default_regno", label: "預設稅籍編號"})
                    ]
                 });				
                 var SearObjRegNoCount = SearObjRegNo.runPaged().count;
                 var RegNoTxtArr = []; //稅籍編號	
                 var defRegNo = ""; //稅籍編號
                 var defUniNo = ""; //統一編號
                 
                 SearObjRegNo.run().each(function(result){	
                     defRegNo = result.getValue({ name: "name" });  //稅籍編號
                     RegNoTxtArr.push(new Array(defRegNo));
                     return true;
                 });	
                 //↑↑↑ 預設稅籍編號 -------------------
                 
                 
                 //↓↓↓ 下載查詢條件介面 ----------------------------
                 var formName = "媒體檔申報 : 營業人進/銷項資料檔";
                 var field_identifier = "";
                 var registration_number = defRegNo;
                 
                 var form = serverWidget.createForm({
                     title : formName
                 });  				 
                     form.addSubmitButton({
                         label: '產生申報檔'
                     });
                     
                 // ============== 表頭COLUMNS ==============
                 var fieldgroup_columns = form.addFieldGroup({
                     id : 'custpage_fg_1',
                     label : '營業人進/銷項資料檔'
                 });
 
                 var GVDText1 = form.addField({
                     id: "custpage_gd01",
                     label: "稅稽編號",
                     type: serverWidget.FieldType.SELECT,
                     container: "custpage_fg_1"
                 });
                     for ( var i=0 ; i<RegNoTxtArr.length ; i++ ) {
                         GVDText1.addSelectOption({
                             value : RegNoTxtArr[i],
                             text  : RegNoTxtArr[i]
                         });
                     }
                     
                 var GVDText2 = form.addField({
                     id: "custpage_gd02",
                     label: "申報範圍(進項,銷項,進銷項)",
                     type: serverWidget.FieldType.SELECT,
                     container: "custpage_fg_1"
                 });
                     GVDText2.addSelectOption({
                         value : '3',
                         text  : '進銷項'
                     });
                     GVDText2.addSelectOption({
                         value : '1',
                         text  : '進項'
                     });	
                     GVDText2.addSelectOption({
                         value : '2',
                         text  : '銷項'
                     });	
                     GVDText2.addSelectOption({
                         value : '3',
                         text  : '進銷項'
                     });					
                 
                 var getD = new Date();
                 var getY = getD.getFullYear();
                 var getm = getD.getMonth();
                 var getM0 = getm+1; //當月份
                 var getM1 = '';
                 var getM2 = '';
                 var GVDText3 = form.addField({
                     id: "custpage_gd03",
                     label: "申報年度",
                     type: serverWidget.FieldType.SELECT,
                     container: "custpage_fg_1"
                 });
                     GVDText3.addSelectOption({
                         value : getY,
                         text  : getY
                     });					
                     for( var i=getY-1 ; i<getY+1 ; i++ ){
                     GVDText3.addSelectOption({
                         value : i,
                         text  : i
                     });						
                     }					
                 
                 //申報起迄月份, 預設為當期
                 if (getM0==1 || getM0==2) {
                     getM1 = 1;
                     getM2 = 2;
                 }
                 else if (getM0==3 || getM0==4) {
                     getM1 = 3;
                     getM2 = 4;
                 }
                 else if (getM0==5 || getM0==6) {
                     getM1 = 5;
                     getM2 = 6;
                 }
                 else if (getM0==7 || getM0==8) {
                     getM1 = 7;
                     getM2 = 8;
                 }
                 else if (getM0==9 || getM0==10) {
                     getM1 = 9;
                     getM2 = 10;
                 }
                 else if (getM0==11 || getM0==12) {
                     getM1 = 11;
                     getM2 = 12;
                 }
                 else {
                     getM1 = 99;
                     getM2 = 99;
                 }				
                 var GVDText4 = form.addField({
                     id: "custpage_gd04",
                     label: "申報月起",
                     type: serverWidget.FieldType.SELECT,
                     container: "custpage_fg_1"
                 });
                     GVDText4.addSelectOption({
                         value : getM1,
                         text  : getM1
                     });
                     var gdmonth = 13;
                     var gdm = "";
                     for( var i=1 ; i<gdmonth ; i++ ){
                         // if (i<10){gdm='0'+i;}
                         // else {gdm=i;}
                     GVDText4.addSelectOption({						
                         value : i,
                         text  : i
                     });
                     }
                 
                 var GVDText5 = form.addField({
                     id: "custpage_gd05",
                     label: "申報月迄",
                     type: serverWidget.FieldType.SELECT,
                     container: "custpage_fg_1"
                 });
                     GVDText5.addSelectOption({
                         value : getM2,
                         text  : getM2
                     });
                     var gdmonth = 13;
                     var gdm = "";
                     for( var i=1 ; i<gdmonth ; i++ ){
                         // if (i<10){gdm='0'+i;}
                         // else {gdm=i;}
                     GVDText5.addSelectOption({						
                         value : i,
                         text  : i
                     });
                     }
                 
                 //↑↑↑ 下載查詢條件介面 ----------------------------	
                 
                 //-----------------------------------				
                 var searchResult = {
                    form: form
                };

                context.write(searchResult, "");
                 //-----------------------------------
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