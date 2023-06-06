/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/error', './commonAPI/commonUtil', 'N/runtime', 'N/file'],
	/**
	 * @param {serverWidget} serverWidget
	 * @param {search} search
	 */
	function (ui, search, task, error, util, runtime, file) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		var form;
		if (context.request.method === 'GET') {
			form = createForm();
		} else {
            try {
                // after press button 
                //接前頁參數
                //一般媒體申報_條件內容
                var request = context.request;
                var rgd01 = request.parameters.custpage_gd01;  //稅籍編號
                var rgd02 = request.parameters.custpage_gd02;  //申報範圍:1進項,2銷項,3進銷項
                var rgd03 = request.parameters.custpage_gd03;  //申報年度
                var rgd04 = request.parameters.custpage_gd04;  //申報月份_起
                var rgd05 = request.parameters.custpage_gd05;  //申報月份_迄
                var mr_scripttaskid = request.parameters.mr_scripttaskid;
                log.debug("mr_scripttaskid", mr_scripttaskid);
                log.debug('rgd01', rgd01);
                log.debug('rgd02', rgd02);
                log.debug('rgd03', rgd03);
                log.debug('rgd04', rgd04);
                log.debug('rgd05', rgd05);

                if(mr_scripttaskid == null){
                    //呼叫MR
                    log.debug('呼叫MR');
                    form = CallMR(rgd01,rgd02,rgd03,rgd04,rgd05);
                }else{ 
                    log.debug('呼叫createStatusForm');
                    form = createStatusForm(mr_scripttaskid);
                }                                         
            } catch (error) {
                log.debug(error.name,error.message);
            }   		
		}
        context.response.writePage(form);
	}

	function createForm()
    {
        var num = 1;
        log.debug('初始畫面次數', num);
			//↓↓↓ 預設稅籍編號 -------------------
            var SearObjRegNo = search.create({
                type: "customrecord_ev_registrations_all",
                //filters:[["custrecord_18_default_regno","is","true"]], //僅抓取預設稅籍編號
                filters: [],
                columns: [
                    search.createColumn({ name: "name", label: "Name" }), //稅籍編號
                    search.createColumn({ name: "custrecord_18_site_uniform_number", label: "統一編號" }),
                    search.createColumn({ name: "custrecord_18_default_regno", label: "預設稅籍編號" })
                ]
            });
            var SearObjRegNoCount = SearObjRegNo.runPaged().count;
            var RegNoTxtArr = []; //稅籍編號	
            var defRegNo = ""; //稅籍編號
            var defUniNo = ""; //統一編號

            SearObjRegNo.run().each(function (result) {
                defRegNo = result.getValue({ name: "name" });  //稅籍編號
                RegNoTxtArr.push(new Array(defRegNo));
                return true;
            });
            //↑↑↑ 預設稅籍編號 -------------------


            //↓↓↓ 下載查詢條件介面 ----------------------------
            var formName = "媒體檔申報 : 營業人進/銷項資料檔";
            var field_identifier = "";
            var registration_number = defRegNo;

            var form = ui.createForm({
                title: formName
            });
            form.addSubmitButton({
                label: '產生申報檔'
            });

            // ============== 表頭COLUMNS ==============
            var fieldgroup_columns = form.addFieldGroup({
                id: 'custpage_fg_1',
                label: '營業人進/銷項資料檔'
            });

            var GVDText1 = form.addField({
                id: "custpage_gd01",
                label: "稅稽編號",
                type: ui.FieldType.SELECT
                //container: "custpage_fg_1"
            });
            for (var i = 0; i < RegNoTxtArr.length; i++) {
                GVDText1.addSelectOption({
                    value: RegNoTxtArr[i],
                    text: RegNoTxtArr[i]
                });
            }

            var GVDText2 = form.addField({
                id: "custpage_gd02",
                label: "申報範圍(進項,銷項,進銷項)",
                type: ui.FieldType.SELECT
                //container: "custpage_fg_1"
            });
            GVDText2.addSelectOption({
                value: '3',
                text: '進銷項'
            });
            GVDText2.addSelectOption({
                value: '1',
                text: '進項'
            });
            GVDText2.addSelectOption({
                value: '2',
                text: '銷項'
            });
            GVDText2.addSelectOption({
                value: '3',
                text: '進銷項'
            });

            var getD = new Date();
            var getY = getD.getFullYear();
            var getm = getD.getMonth();
            var getM0 = getm + 1; //當月份
            var getM1 = '';
            var getM2 = '';
            var GVDText3 = form.addField({
                id: "custpage_gd03",
                label: "申報年度",
                type: ui.FieldType.SELECT,
                container: "custpage_fg_1"
            });
            GVDText3.addSelectOption({
                value: getY,
                text: getY
            });
            for (var i = getY - 1; i < getY + 1; i++) {
                GVDText3.addSelectOption({
                    value: i,
                    text: i
                });
            }

            //申報起迄月份, 預設為當期
            if (getM0 == 1 || getM0 == 2) {
                getM1 = 1;
                getM2 = 2;
            }
            else if (getM0 == 3 || getM0 == 4) {
                getM1 = 3;
                getM2 = 4;
            }
            else if (getM0 == 5 || getM0 == 6) {
                getM1 = 5;
                getM2 = 6;
            }
            else if (getM0 == 7 || getM0 == 8) {
                getM1 = 7;
                getM2 = 8;
            }
            else if (getM0 == 9 || getM0 == 10) {
                getM1 = 9;
                getM2 = 10;
            }
            else if (getM0 == 11 || getM0 == 12) {
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
                type: ui.FieldType.SELECT,
                container: "custpage_fg_1"
            });
            GVDText4.addSelectOption({
                value: getM1,
                text: getM1
            });
            var gdmonth = 13;
            var gdm = "";
            for (var i = 1; i < gdmonth; i++) {
                // if (i<10){gdm='0'+i;}
                // else {gdm=i;}
                GVDText4.addSelectOption({
                    value: i,
                    text: i
                });
            }

            var GVDText5 = form.addField({
                id: "custpage_gd05",
                label: "申報月迄",
                type: ui.FieldType.SELECT,
                container: "custpage_fg_1"
            });
            GVDText5.addSelectOption({
                value: getM2,
                text: getM2
            });
            var gdmonth = 13;
            var gdm = "";
            for (var i = 1; i < gdmonth; i++) {
                // if (i<10){gdm='0'+i;}
                // else {gdm=i;}
                GVDText5.addSelectOption({
                    value: i,
                    text: i
                });
            }
            num++;
            return form;
	}
    
    function createStatusForm(scriptTaskId) {		
        try {
             //狀態顯示
             var form = ui.createForm({
                title: '報表產生中...'
             });

             var summary = task.checkStatus(scriptTaskId);
             if(summary.status == "PENDING" || summary.status == "PROCESSING" ){
                var mr_scripttaskid = form.addField({
					id: 'mr_scripttaskid',
					label: 'mr_scripttaskid',
					type: ui.FieldType.TEXT
				});
                mr_scripttaskid.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                mr_scripttaskid.defaultValue = scriptTaskId;
                form.addSubmitButton({
                    label: '重新整理狀態'
                });

                //讀取scripttype
                var ScriptID = getScript("script","customscript_ev_mr_gvd_export");
                //讀取primarykey
                var DeploymentID = getScript("scriptdeployment","customdeploy_ev_mr_gvd_export");


                form.addButton({
					id: "custpage_send_ev",
					label: "檢視進度表",
					functionName: "window.open(\'"+util.getUrl()+"/app/common/scripting/mapreducescriptstatus.nl?sortcol=dcreated&sortdir=DESC&date=TODAY&scripttype="+ScriptID+"&primarykey="+DeploymentID+"\');"
                });
                
                
             }else if(summary.status == "COMPLETE"){
                form.title ="報表產生已完成";                
                var scheduleLink = form.addField({
                    id : 'custpage_temp_1',
                    type : ui.FieldType.URL,
                    label : "點選底下連結下載檔案"
                });
                scheduleLink.updateDisplayType({
                    displayType: ui.FieldDisplayType.INLINE
                });

                var foldername = runtime.getCurrentUser().name;
                var fileObj = file.load({
                    id: './MediaFile/83178333.txt'
                });

                scheduleLink.defaultValue =fileObj.url;
             }
             else{
                var mr_error = form.addField({
					id: 'mr_error',
					label: 'mr_error',
					type: ui.FieldType.TEXT
				});
                mr_error.defaultValue = "報表產生失敗";
             }                                    
            return form; 
        } catch (error) {
            log.debug("createStatusForm_error:"+error.name,error.message);
        }       
    } 
    
    function getScript(type,scriptid){
        try {
            var resultsid=""
            var scriptSearchObj = search.create({
                type: type,
                filters:
                [
                    ["scriptid","is",scriptid]
                ],
                columns:
                [
                    search.createColumn({name: "scriptid", label: "Script ID"})
                ]
            });    
            scriptSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                resultsid = result.id;
                return true;
            });
            return resultsid;
        } catch (error) {
            log.debug("getdepartmentSelect_error:"+error.name,error.message);
        }
    }     
    function CallMR(rgd01, rgd02, rgd03, rgd04, rgd05){
        try {
            var form;
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE
            });
            mrTask.scriptId = 'customscript_ev_mr_gvd_export';
            mrTask.deploymentId = 'customdeploy_ev_mr_gvd_export';
            mrTask.params = {
                'custscript_rgd01': rgd01,
                'custscript_rgd02': rgd02,
                'custscript_rgd03': rgd03,
                'custscript_rgd04': rgd04,
                'custscript_rgd05': rgd05,
            };

            var scriptTaskId = mrTask.submit();

            form = createStatusForm(scriptTaskId);
            return form;
        } catch (error) {
            if(error.name == "MAP_REDUCE_ALREADY_RUNNING"){
                form = CallMR(rgd01, rgd02, rgd03, rgd04, rgd05)
                return form;
            }else{
                log.debug(error.name,error.message);
                var scriptObj = runtime.getCurrentScript();
                util.ScriptErrorSendMailToOwner(scriptObj.id,"庫齡報表","目前產生報表皆在滿載中...請稍後再試");
                form = ui.createForm({
                    title: '報表產生中...'
                 });
                var mr_error = form.addField({
                    id: 'mr_error',
                    label: 'mr_error',
                    type: ui.FieldType.TEXT
                });
                mr_error.defaultValue = "目前產生報表皆在滿載中...請稍後再試";
                return form;
            }
        }
    }
	return {
		onRequest: onRequest
	};

});