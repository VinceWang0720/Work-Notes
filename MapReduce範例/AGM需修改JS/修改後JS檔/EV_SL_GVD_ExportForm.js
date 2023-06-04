/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/ui/serverWidget', 'N/search', 'N/task', './commonAPI/commonUtil', 'N/runtime', 'N/file'],
	/**
	 * @param {serverWidget} serverWidget
	 * @param {search} search
	 */
	function (serverWidget, search, task, util, runtime,file) {
		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2023.5
		 */

		function onRequest(context) {

			var req = context.request;
			var form;

			if (context.request.method === 'GET') {
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

				form = serverWidget.createForm({
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
					type: serverWidget.FieldType.SELECT,
					container: "custpage_fg_1"
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
					type: serverWidget.FieldType.SELECT,
					container: "custpage_fg_1"
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
					type: serverWidget.FieldType.SELECT,
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
					type: serverWidget.FieldType.SELECT,
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
					type: serverWidget.FieldType.SELECT,
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

				//↑↑↑ 下載查詢條件介面 ----------------------------	

				//-----------------------------------				
				context.response.writePage(form);
				//-----------------------------------
			} else {
				try {
					// after press button 
					//接前頁參數
					//一般媒體申報_條件內容
					var rgd01 = req.parameters.custpage_gd01;  //稅籍編號
					var rgd02 = req.parameters.custpage_gd02;  //申報範圍:1進項,2銷項,3進銷項
					var rgd03 = req.parameters.custpage_gd03;  //申報年度
					var rgd04 = req.parameters.custpage_gd04;  //申報月份_起
					var rgd05 = req.parameters.custpage_gd05;  //申報月份_迄
					var mr_scripttaskid = req.parameters.mr_scripttaskid;
					log.debug("mr_scripttaskid", mr_scripttaskid);
					log.debug('rgd01', rgd01);
					log.debug('rgd02', rgd02);
					log.debug('rgd03', rgd03);
					log.debug('rgd04', rgd04);
					log.debug('rgd05', rgd05);

					if (mr_scripttaskid == null) {
						//呼叫MR
						form = callMR(context, rgd01, rgd02, rgd03, rgd04, rgd05);
					} else {
						form = createStatusForm(mr_scripttaskid);
					}
					context.response.writePage(form);



					//var fileURL = value;
					// var fileURL = '無法顯示URL';
					// //結果回報頁面 ----------------------------------
					// var form = serverWidget.createForm({
					// 	title: "媒體檔申報 -- 檔案下載結果 " // + loadScope + ' ' + rgd04 + ' ' + rgd05
					// });

					// // ============== 表頭COLUMNS ==============
					// var fieldgroup_columns = form.addFieldGroup({
					// 	id: 'custpage_RG1',
					// 	label: '營業人進/銷項資料檔'
					// });

					// var RA1 = form.addField({
					// 	id: "custpage_rgd01",
					// 	label: "稅稽編號",
					// 	type: serverWidget.FieldType.TEXT,
					// 	container: "custpage_RG1"
					// });
					// RA1.defaultValue = rgd01;
					// RA1.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

					// var RA2 = form.addField({
					// 	id: "custpage_rgd02",
					// 	label: "申報範圍(進項,銷項,進銷項)",
					// 	type: serverWidget.FieldType.TEXT,
					// 	container: "custpage_RG1"
					// });
					// var rgd02show = '';
					// if (rgd02 == '1') { rgd02show = '進項'; }
					// if (rgd02 == '2') { rgd02show = '銷項'; }
					// if (rgd02 == '3') { rgd02show = '進銷項'; }
					// RA2.defaultValue = rgd02show;
					// RA2.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

					// var RA3 = form.addField({
					// 	id: "custpage_rgd03",
					// 	label: "申報年度",
					// 	type: serverWidget.FieldType.TEXT,
					// 	container: "custpage_RG1"
					// });
					// RA3.defaultValue = rgd03;
					// RA3.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

					// var RA4 = form.addField({
					// 	id: "custpage_rgd04",
					// 	label: "申報月起",
					// 	type: serverWidget.FieldType.TEXT,
					// 	container: "custpage_RG1"
					// });
					// RA4.defaultValue = rgd04;
					// RA4.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

					// var RA5 = form.addField({
					// 	id: "custpage_rgd05",
					// 	label: "申報月迄",
					// 	type: serverWidget.FieldType.TEXT,
					// 	container: "custpage_RG1"
					// });
					// RA5.defaultValue = rgd05;
					// RA5.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

					// var RA8 = form.addField({
					// 	id: "custpage_rgd08",
					// 	label: "檔案下載結果",
					// 	type: serverWidget.FieldType.TEXT,
					// 	container: "custpage_RG1"
					// });
					// RA8.defaultValue = fileURL;
					// RA8.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
					// //-----------------------------------	
					// context.response.writePage(form);
					// //-----------------------------------	
				} catch (error) {
					log.debug(error.name, error.message);
				}
			}
		}

		function callMR(context, rgd01, rgd02, rgd03, rgd04, rgd05) {
			var form;
			try {
				log.debug("Into the callMR Function");
				var mrTask = task.create({
					taskType: task.TaskType.MAP_REDUCE,
					scriptId: 'customscript_ev_mr_gvd_export',
					deploymentId: 'customdeploy_ev_mr_gvd_export',
					params: {
						'custscript_rgd01': rgd01,
						'custscript_rgd02': rgd02,
						'custscript_rgd03': rgd03,
						'custscript_rgd04': rgd04,
						'custscript_rgd05': rgd05,
					}
				});

				mrTask.scriptId = 'customscript_ev_mr_gvd_export';
				mrTask.deploymentId = 'customdeploy_ev_mr_gvd_export';
				mrTask.paras = {
					'rgd01': rgd01,
					'rgd02': rgd02,
					'rgd03': rgd03,
					'rgd04': rgd04,
					'rgd01': rgd01,
				};

				var mrTaskId = mrTask.submit();
				log.debug("mrTaskId",mrTaskId);
				var taskOutput = task.checkStatus(mrTaskId).output;
				log.debug("Status",task.checkStatus(mrTaskId));
				log.debug("taskOutput",taskOutput);
				taskOutput.run().each(function(result) {
					var key = result.key;
					log.debug("key：",key);
					var value = result.value;
					log.debug("value：",value);
				})

				var fileURL = value;
				//結果回報頁面 ----------------------------------
				var form = serverWidget.createForm({
					title: "媒體檔申報 -- 檔案下載結果 " // + loadScope + ' ' + rgd04 + ' ' + rgd05
				});

				// ============== 表頭COLUMNS ==============
				var fieldgroup_columns = form.addFieldGroup({
					id: 'custpage_RG1',
					label: '營業人進/銷項資料檔'
				});

				var RA1 = form.addField({
					id: "custpage_rgd01",
					label: "稅稽編號",
					type: serverWidget.FieldType.TEXT,
					container: "custpage_RG1"
				});
				RA1.defaultValue = rgd01;
				RA1.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

					var scheduleLink = form.addField({
						id: 'custpage_temp_1',
						type: serverWidget.FieldType.URL,
						label: "點選底下連結下載檔案"
					});

					var foldername = runtime.getCurrentUser().name;
					var fileObj = file.load({
						id: '客製報表/' + foldername + '/' + '媒體申報.txt'
					});

					scheduleLink.defaultValue = fileObj.url;

				} else {
					log.debug("7");
					var mr_error = form.addField({
						id: 'mr_error',
						label: 'mr_error',
						type: serverWidget.FieldType.TEXT
					});
					mr_error.defaultValue = "報表產生失敗";
				}
				log.debug('form', form);
				return form;
			} catch (error) {
				log.debug("createStatusForm_error:" + error.name, error.message);
			}
		}

		function getScript(type, scriptid) {
			try {
				var resultsid = ""
				var scriptSearchObj = search.create({
					type: type,
					filters:
						[
							["scriptid", "is", scriptid]
						],
					columns:
						[
							search.createColumn({ name: "scriptid", label: "Script ID" })
						]
				});
				scriptSearchObj.run().each(function (result) {
					// .run().each has a limit of 4,000 results
					resultsid = result.id;
					return true;
				});
				return resultsid;
			} catch (error) {
				log.debug("getdepartmentSelect_error:" + error.name, error.message);
			}
		}

		function createForm() { }

		return {
			onRequest: onRequest
		};

	});