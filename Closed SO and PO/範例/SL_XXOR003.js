/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget', 'N/search','N/task', './commonUtil', 'N/file','N/runtime','N/record', 'N/runtime'],
	function (ui, search,task,util,file,runtime,record, runtime) {

	function onRequest(context) {
		var form;
		if (context.request.method === 'GET') {
			form = createForm();
			context.response.writePage(form);
		} else {
			try {
                var deploymentCount = 0;
                var request = context.request;
				var datefrom = request.parameters.datefrom;
				var dateto = request.parameters.dateto;
				var invoiceNo = request.parameters.invoiceno;
				var creditMemoNo = request.parameters.creditmemono;
				var customerId = request.parameters.customerid;
				var soNo = request.parameters.sono;  
                var mr_scripttaskid = request.parameters.mr_scripttaskid;
                log.debug("mr_scripttaskid",mr_scripttaskid);
                if(mr_scripttaskid == null){
                    //呼叫MR
                    form = CallMR(datefrom,dateto,invoiceNo,creditMemoNo,customerId,soNo,deploymentCount);
                }else{ 
                    form = createStatusForm(mr_scripttaskid);
                }                                         
            } catch (error) {
                log.debug(error.name,error.message);
            }         
		}    
		context.response.writePage(form);
	}

	function createForm() {
		var form = ui.createForm({
				title: 'Sales Analysis Report'
			});

		form.addSubmitButton({
			label: '產生'
		});

		var datefrom = form.addField({
				id: 'datefrom',
				type: ui.FieldType.DATE,
				label: 'Date From'
			});
		datefrom.isMandatory = true;
		// datefrom.defaultValue = "10/1/2019";

		var dateto = form.addField({
				id: 'dateto',
				type: ui.FieldType.DATE,
				label: 'Date To'
			});
		dateto.isMandatory = true;
		// dateto.defaultValue = "10/5/2019";

		form.addField({
			id: 'invoiceno',
			type: ui.FieldType.TEXT,
			label: 'Invoice No'
		});

		form.addField({
			id: 'creditmemono',
			type: ui.FieldType.TEXT,
			label: 'Credit Memo No'
		});

		form.addField({
			id: 'customerid',
			type: ui.FieldType.SELECT,
			label: 'Customer Name',
			source: 'customer'
		});

		form.addField({
			id: 'sono',
			type: ui.FieldType.TEXT,
			label: 'SO No:'
		});

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
                var ScriptID = getScript("script","customscript_mr_xxor003_salesanalysis");
                //讀取primarykey
                var DeploymentID = getScript("scriptdeployment","customdeploy_mr_xxor003_salesanalysis");


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
                    id: '客製報表/'+ foldername + '/' + 'Sales Analysis Report.xls'
                });

                scheduleLink.defaultValue =fileObj.url;
             }else{
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
    function CallMR(datefrom,dateto,invoiceNo,creditMemoNo,customerId,soNo,deploymentCount){
        try {         
            var form;
            var mapreduceScriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE
                });

                mapreduceScriptTask.scriptId = "customscript_mr_xxor003_salesanalysis";
                mapreduceScriptTask.deploymentId = "customdeploy_mr_xxor003_salesanalysis_"+deploymentCount;
                mapreduceScriptTask.params = {
                'custscript_mr_xxor003_datefrom': datefrom.toString(),
                'custscript_mr_xxor003_dateto': dateto.toString(),
                'custscript_mr_xxor003_invoiceno': invoiceNo.toString(),
                'custscript_mr_xxor003_creditmemono': creditMemoNo.toString(),
                'custscript_mr_xxor003_customerid': customerId.toString(),
                'custscript_mr_xxor003_sono': soNo.toString()
                };

                var scriptTaskId = mapreduceScriptTask.submit();

                form = createStatusForm(scriptTaskId);
                return form;
        } catch (error) {
            if(error.name == "MAP_REDUCE_ALREADY_RUNNING"){
                deploymentCount+=1;
                form = CallMR(datefrom,dateto,invoiceNo,creditMemoNo,customerId,soNo,deploymentCount)
                return form;
            }else{
                log.debug(error.name,error.message);
                var scriptObj = runtime.getCurrentScript();
                util.ScriptErrorSendMailToOwner(scriptObj.id,"Sales Analysis Report報表","目前產生報表皆在滿載中...請稍後再試");
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
	function getTerms(customerEntityId){
		var returnTerms = "";
		if(customerEntityId!=""){
			var customerSearchObj = search.create({
			type: "customer",
			filters:
			[
			   ["entityid","is",customerEntityId]
			],
			columns:
			[			   
			   search.createColumn({name: "terms", label: "Terms"})
			]
		 });
		
		 customerSearchObj.run().each(function(result){
			returnTerms = result.getText({name: "terms"});
			return true;
		 });
		}		
		 log.debug("returnTerms",returnTerms);
		 return returnTerms;
	}
	return {
		onRequest: onRequest
	};

});
