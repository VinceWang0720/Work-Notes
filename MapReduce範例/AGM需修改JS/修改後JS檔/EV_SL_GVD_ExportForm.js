/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/ui/serverWidget', 'N/search', 'N/task'],
	/**
	 * @param {serverWidget} serverWidget
	 * @param {search} search
	 */
	function (serverWidget, search, task) {
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

				var form = serverWidget.createForm({
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
				// after press button 
				//接前頁參數
				//一般媒體申報_條件內容
				var rgd01 = req.parameters.custpage_gd01;  //稅籍編號
				var rgd02 = req.parameters.custpage_gd02;  //申報範圍:1進項,2銷項,3進銷項
				var rgd03 = req.parameters.custpage_gd03;  //申報年度
				var rgd04 = req.parameters.custpage_gd04;  //申報月份_起
				var rgd05 = req.parameters.custpage_gd05;  //申報月份_迄

				log.debug('rgd01', rgd01);
				log.debug('rgd02', rgd02);
				log.debug('rgd03', rgd03);
				log.debug('rgd04', rgd04);
				log.debug('rgd05', rgd05);



				var mrTask = task.creat({
					taskType: task.TaskType.MAP_REDUCE
				});

				mrTask.scriptId = 'customscript_ev_mr_gvd_export';
				mrTask.deploymentId = 'customscript_ev_mr_gvd_export';
				mrTask.paras = {
					'rgd01': rgd01,
					'rgd02': rgd02,
					'rgd03': rgd03,
					'rgd04': rgd04,
					'rgd01': rgd01,
				};

				var mrTaskId = mrTask.submit();

				var taskOutput = task.getOutput(mrTaskId);

				var fileURL = taskOutput[0];

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

				var RA2 = form.addField({
					id: "custpage_rgd02",
					label: "申報範圍(進項,銷項,進銷項)",
					type: serverWidget.FieldType.TEXT,
					container: "custpage_RG1"
				});
				var rgd02show = '';
				if (rgd02 == '1') { rgd02show = '進項'; }
				if (rgd02 == '2') { rgd02show = '銷項'; }
				if (rgd02 == '3') { rgd02show = '進銷項'; }
				RA2.defaultValue = rgd02show;
				RA2.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

				var RA3 = form.addField({
					id: "custpage_rgd03",
					label: "申報年度",
					type: serverWidget.FieldType.TEXT,
					container: "custpage_RG1"
				});
				RA3.defaultValue = rgd03;
				RA3.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

				var RA4 = form.addField({
					id: "custpage_rgd04",
					label: "申報月起",
					type: serverWidget.FieldType.TEXT,
					container: "custpage_RG1"
				});
				RA4.defaultValue = rgd04;
				RA4.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

				var RA5 = form.addField({
					id: "custpage_rgd05",
					label: "申報月迄",
					type: serverWidget.FieldType.TEXT,
					container: "custpage_RG1"
				});
				RA5.defaultValue = rgd05;
				RA5.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

				var RA8 = form.addField({
					id: "custpage_rgd08",
					label: "檔案下載結果",
					type: serverWidget.FieldType.URL,
					container: "custpage_RG1"
				});
				RA8.defaultValue = fileURL;
				RA8.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
				//-----------------------------------	
				context.response.writePage(form);
				//-----------------------------------	

			}
		}

		function createForm() { }

		return {
			onRequest: onRequest
		};

	});