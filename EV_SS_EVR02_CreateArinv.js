/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(['N/record', 'N/ui/message', 'N/search', 'N/runtime', 'N/error', './commonAPI/commonUtil', './commonAPI/Common_ColumnCheck'],
	function (record, message, search, runtime, error, util, common) {
		function execute(context) {
			var strLog = "";
			var strErrorLog = "";
			var amount = 0; //發票金額
			var tax = 0; //發票稅額
			var fulfillment_id = runtime.getCurrentScript().getParameter("custscript_fulfillmentid");
			var mySearchFilter = null;
			log.debug('---START---');
			if (fulfillment_id) {
				mySearchFilter = search.createFilter({
					name: 'internalid',
					operator: search.Operator.IS,
					values: [fulfillment_id]
				});
			}
			var itemfulfillmentSearchObj = search.create({
				type: record.Type.ITEM_FULFILLMENT, //"itemfulfillment",
				filters:
					[
						["type", "anyof", "ItemShip"],
						"AND",
						["mainline", "is", "T"],
						"AND",
						["custbody_gv_attached_gui_id", "anyof", "@NONE@"],
						"AND",
						["createdfrom.custbody_gv_generated_type", "anyof", "3"],
						"AND",
						["status", "anyof", "ItemShip:C"],
						"AND",
						["custbodytotalitemamount", "greaterthan", "0.00"]
					],
				columns:
					[
						search.createColumn({
							name: "createdfrom"
						}), //CREATED FROM
						search.createColumn({
							name: "custbody_gv_attached_gui_id"
						}),
						search.createColumn({
							name: "internalid"
						}),
						search.createColumn({ name: "tranid", label: "Document Number" }),
						search.createColumn({
							name: "createdby"
						}),
						search.createColumn({
							name: "trandate",
							sort: search.Sort.ASC
						}),
						search.createColumn({
							name: "vatregnumber",
							join: "customer",
							label: "Tax Number"
						}),
						search.createColumn({ name: "custbody_gv_invoice_no", label: "已產生Invoice" })
					]
			});

			var filters_1 = itemfulfillmentSearchObj.filters;
			if (mySearchFilter) {
				filters_1.push(mySearchFilter);
			}
			itemfulfillmentSearchObj.filters = filters_1;

			searchCount = itemfulfillmentSearchObj.runPaged().count;
			log.debug("searchCount", searchCount);
			if (searchCount == 0) {
				strLog += "沒有需要產生的發票"
				log.debug("流程Log", strLog);
				return;
			}
			itemfulfillmentSearchObj.run().each(function (result) {
				//log.debug("Run itemfulfillmentSearchObj：","開始");
				//判斷fillment對應的invoice是否有開立發票
				var guiforminvoice = false;
				//記錄在fillment上面的invoiceNO
				var fillmentNO_oninvoice = result.getValue({ name: 'custbody_gv_invoice_no' });
				if (fillmentNO_oninvoice != "") {
					guiforminvoice = searchinvoice(fillmentNO_oninvoice);
				}
				//避免以開立的出貨單  重復開立
				var customrecord_ev_rec_invoices_allSearchObj = search.create({
					type: "customrecord_ev_rec_invoices_all",
					filters:
						[
							["custrecord_1_first_fulfill_no", "is", result.getValue({ name: 'tranid' })]
						],
					columns:
						[
						]
				});
				var searchResultCount = customrecord_ev_rec_invoices_allSearchObj.runPaged().count;
				//log.debug("searchResultCount：",searchResultCount);
				if (searchResultCount == 0 && !guiforminvoice) {
					//log.debug("成功","成功");
					var nowDate = util.getNewDate();
					var nowYear = nowDate.getFullYear();
					var nowMonth = nowDate.getMonth() + 1;
					var nowTime = new util.dateObj().getSystime();

					strLog += "====(資料檢查)\n";
					amount = 0; //發票金額
					tax = 0; //發票稅額
					try {
						var SalesOrderRecord = record.load({
							type: record.Type.SALES_ORDER,
							id: result.getValue({
								name: 'createdfrom'
							}),
							isDynamic: true
						});
						strLog += "[SalesOrder:" + SalesOrderRecord.getValue('tranid') + "]\n";
						var itemfulfillmentRecord = record.load({
							type: record.Type.ITEM_FULFILLMENT, //"itemfulfillment",
							id: result.getValue({
								name: 'internalid'
							}),
							isDynamic: true
						});
						strLog += "[itemfulfillment:" + itemfulfillmentRecord.getValue('tranid') + "]\n";
					} catch (error) {
						strErrorLog += "Record.Load錯誤-[" + error.name + "]-錯誤訊息[" + error.message + "]\n";
						SendEmail(strErrorLog);
						log.error("錯誤Log", strErrorLog);
						return;
					}
					//建立銷項發票-開始
					try {
						var recRecord = record.create({
							type: 'customrecord_ev_rec_invoices_all',
							isDynamic: true
						});

						var userObj = runtime.getCurrentUser();
						//userObj.role		
						strLog += "[1.Role:" + userObj.role + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_role',
							value: userObj.role
						});
						// 發票日期
						strLog += "[2.發票日期:" + nowDate + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_gui_date',
							value: nowDate
						});
						// 發票時間
						strLog += "[3.發票時間:" + nowTime + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_gui_time',
							value: nowTime
						});
						// 所屬年
						strLog += "[4.所屬年:" + nowYear + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_gui_year',
							value: nowYear
						});
						// 所屬月
						strLog += "[5.所屬月:" + nowMonth + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_gui_month',
							value: nowMonth
						});

						// 客戶名稱
						// 2019/06/26 Matt修正為客戶名稱抓SaleOrder
						strLog += "[14.客戶名稱]-[" + SalesOrderRecord.getValue('entity') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_customer',
							value: SalesOrderRecord.getValue('entity')
						});
						// 讀取客戶統編
						var customerRecord = search.lookupFields({
							type: "customer",
							id: SalesOrderRecord.getValue('entity'),
							columns: [
								'vatregnumber'
							]
						});
						// 客戶統編
						strLog += "[15.客戶統編]-[" + customerRecord['vatregnumber'] + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_sales_no',
							value: customerRecord['vatregnumber']
						});
						// 買受人統一編號
						strLog += "[23.買受人統一編號]-[" + SalesOrderRecord.getValue('custbody_gv_buyer_no') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_buyer_no',
							value: SalesOrderRecord.getValue('custbody_gv_buyer_no')
						});
						// 格式別
						strLog += "[9.格式別:" + SalesOrderRecord.getValue('custbody_gv_format_type') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_format_type',
							value: SalesOrderRecord.getValue('custbody_gv_format_type')
						});
						// 課稅別
						strLog += "[10.課稅別]-[" + SalesOrderRecord.getValue('custbody_gv_tax_code') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_tax_code',
							value: SalesOrderRecord.getValue('custbody_gv_tax_code')
						});
						// 含稅類別
						strLog += "[11.含稅類別]-[" + SalesOrderRecord.getValue('custbody_gv_tax_calc_type') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_tax_calc_type',
							value: SalesOrderRecord.getValue('custbody_gv_tax_calc_type')
						});
						// 發票聯式
						strLog += "[12.發票聯式]-[" + SalesOrderRecord.getValue('custbody_gv_gui_type') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_gui_type',
							value: SalesOrderRecord.getValue('custbody_gv_gui_type')
						});
						var einv_type = "";
						//發票聯式判斷電子發票格式				
						if (SalesOrderRecord.getValue('custbody_gv_gui_type') == "1") {
							einv_type = common.GetCustomListValue('A0401 B2B 開立發票', 'customlist_gv_einv_type');
						} else {
							einv_type = common.GetCustomListValue('C0401 B2C 開立發票', 'customlist_gv_einv_type');
						}
						strLog += "[XX.電子發票格式:" + einv_type + "]\n";
						// 電子發票格式
						recRecord.setValue({
							fieldId: 'custrecord_1_einv_type',
							value: einv_type
						});
						var einv_type = recRecord.getValue('custrecord_1_einv_type');
						if (einv_type >= 5) {
							//隨機碼
							recRecord.setValue({
								fieldId: 'custrecord_1_einv_random_no',
								value: getRandonCode()
							});
							// 電子發票作廢格式
							recRecord.setValue({
								fieldId: 'custrecord_1_einv_type_void',
								value: common.GetCustomListValue('C0501 B2C 作廢發票', 'customlist_gv_einv_type')
							});
						} else {
							// 電子發票作廢格式
							recRecord.setValue({
								fieldId: 'custrecord_1_einv_type_void',
								value: common.GetCustomListValue('A0501 B2B 作廢發票', 'customlist_gv_einv_type')
							});
						}
						// 客戶稅碼
						strLog += "[13.客戶稅碼]-[" + SalesOrderRecord.getValue('custbody_gv_cust_tax_code') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_cust_tax_code',
							value: SalesOrderRecord.getValue('custbody_gv_cust_tax_code')
						});
						//開立方式
						recRecord.setValue({
							fieldId: 'custrecord_1_generated_type',
							value: common.GetCustomListValue('隨貨開立', 'customlist_gv_generated_type')
						});
						// 開立人員
						var curruser = runtime.getCurrentUser().id;
						var printtype = SalesOrderRecord.getValue('custbody_gv_print_type');
						log.debug("print_type",printtype);
						var emailsender = searchissuer(printtype);
						// strLog += "[16.開立人員]-[" + result.getValue({ name: 'createdby' }) + "]\n";
						// recRecord.setValue({
						// 	fieldId: 'custrecord_1_confirmed_by',
						// 	value: result.getValue({ name: 'createdby' })
						// });
						strLog += "[16.開立人員]-["+emailsender+"]\n";
						recRecord.setValue({
						fieldId: 'custrecord_1_confirmed_by',
						value: emailsender
						});
						// 列印方式
						strLog += "[18.列印方式]-[" + SalesOrderRecord.getValue('custbody_gv_print_type') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_print_type',
							value: SalesOrderRecord.getValue('custbody_gv_print_type')
						});
						// 2019/09/10 Matt 修改 發票開立選項  4.AR Invoice Description
						recRecord.setValue({
							fieldId: 'custrecord_1_create_option',
							value: common.GetCustomListValue('4:AR Invoice Description', 'customlist_gv_item_desc')
						});
						// 業務
						strLog += "[19.業務]-[" + SalesOrderRecord.getValue('salesrep') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_sales_person',
							value: SalesOrderRecord.getValue('salesrep')
						});
						// 部門
						strLog += "[20.部門]-[" + SalesOrderRecord.getValue('department') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_dept',
							value: SalesOrderRecord.getValue('department')
						});
						// 客戶 PO
						strLog += "[21.PO]-[" + SalesOrderRecord.getValue('otherrefnum') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_customer_po',
							value: SalesOrderRecord.getValue('otherrefnum'),
							ignoreFieldChange: true
						});
						// 發票抬頭
						strLog += "[22.發票抬頭]-[" + SalesOrderRecord.getValue('custbody_gv_customer_name') + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_customer_name',
							value: SalesOrderRecord.getValue('custbody_gv_customer_name')
						});
						//CONFIRMED DATE
						strLog += "[24.CONFIRMED DATE]-[" + nowDate + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_confirmed_date',
							value: nowDate
						});

						//2019/06/11 Matt 新增讀取幣值
						var ex_rate = 1;
						var currencyrateSearchObj = search.create({
							type: "currencyrate",
							filters:
								[
									["basecurrency", "anyof", "1"],
									"AND",
									["transactioncurrency", "anyof", SalesOrderRecord.getValue('currency')],
									"AND",
									["effectivedate", "onorbefore", result.getValue({ name: "trandate", sort: search.Sort.ASC })]
								],
							columns:
								[
									search.createColumn({ name: "basecurrency", label: "Base Currency" }),
									search.createColumn({ name: "transactioncurrency", label: "Transaction Currency" }),
									search.createColumn({ name: "exchangerate", label: "Exchange Rate" }),
									search.createColumn({
										name: "effectivedate",
										sort: search.Sort.DESC,
										label: "Effective Date"
									})
								]
						});
						currencyrateSearchObj.run().each(function (result) {
							ex_rate = result.getValue({ name: "exchangerate" });
						});
						strLog += "[25.幣別:" + SalesOrderRecord.getValue('currency') + "]\n";
						strLog += "[26.fulfillment日期]-[" + result.getValue({ name: "trandate", sort: search.Sort.ASC }) + "]\n";
						strLog += "[27.匯率]-[" + ex_rate + "]\n";

						//發票備註		
						//20190731 抓取最後一個部門
						var oriDept = SalesOrderRecord.getText({ fieldId: 'department' });
						var deptArr = oriDept.split(" : ");
						var dept = (deptArr ? deptArr[deptArr.length - 1] : oriDept);

						//20190731 業務僅顯示姓名
						var oriSalesrep = SalesOrderRecord.getText({ fieldId: 'salesrep' });
						var spArr = oriSalesrep.split(" ");
						var salesrep = (spArr ? spArr[spArr.length - 1] : oriSalesrep);

						//發票備註			
						recRecord.setValue({
							fieldId: 'custrecord_1_other_desc',
							value: ' 出貨單號：' + itemfulfillmentRecord.getValue('tranid') + '\n' +
								//    ' 部門：'+dept+ '\n'+//SalesOrderRecord.getText('department')+ '\n'+
								//    ' 業務：'+salesrep+ '\n'+//SalesOrderRecord.getText('salesrep')+ '\n'+
								' 業務：' + dept + ' ' + salesrep + '\n' +//SalesOrderRecord.getText('department')+ '\n'+
								' 採購號碼：' + SalesOrderRecord.getText('otherrefnum') + '\n' +
								' 匯率：' + util.round(ex_rate, 2) + '\n' +
								' SO單號：' + SalesOrderRecord.getValue('tranid')
						});
						//發票備註(客戶)			
						recRecord.setValue({
							fieldId: 'custrecord_1_other_desc_cust',
							value: itemfulfillmentRecord.getValue('custbody_gv_other_desc_cust')
						});
						//FULFILL_NO			
						recRecord.setValue({
							fieldId: 'custrecord_1_first_fulfill_no',
							value: itemfulfillmentRecord.getValue('tranid')
						});
						//電子發票列印註記
						recRecord.setValue({
							fieldId: 'custrecord_1_einv_print_status',
							value: true
						});
						//Change Request 20200423 Invoice 零稅率通關註記帶入銷項發票========
						recRecord.setValue({
							fieldId: 'custrecord_1_gv_z_doc_flag',
							value: SalesOrderRecord.getValue('custbody_gv_z_doc_flag')
						});
						//==================================================================
						var So_subsidiary = SalesOrderRecord.getValue({ fieldId: 'subsidiary' });
						var regObj = util.getDefaultRegno(So_subsidiary);
						strLog += "[28.SUBSIDIARY]-[" + So_subsidiary + "]\n";
						// SUBSIDIARY
						recRecord.setValue({
							fieldId: 'custrecord_1_subsidiary',
							value: So_subsidiary
						});
						strLog += "[29.公司統編]-[" + regObj[3] + "]\n";
						// 公司統編
						recRecord.setValue({
							fieldId: 'custrecord_1_uniform_no',
							value: regObj[3]
						});
						strLog += "(SUBLIST資料檢查)\n";
						// 發票明細資料
						var sublistId_gui_id = "recmachcustrecord_2_gui_id";
						var LineCount = itemfulfillmentRecord.getLineCount({
							"sublistId": 'item'
						});
						var LineSOCount = SalesOrderRecord.getLineCount({
							"sublistId": 'item'
						});
						//出貨單orderline對到訂單的line
						for (var i = 0; i < LineCount; i++) {
							var orderline = itemfulfillmentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'orderline',
								line: i
							});
							strLog += "[1.orderline:" + orderline + "]\n";
							for (var j = 0; j < LineSOCount; j++) {
								var So_line = SalesOrderRecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'line',
									line: j
								});
								var So_quantity = SalesOrderRecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'quantity',
									line: j
								});
								strLog += "[2.line:" + So_line + "]\n";
								if (orderline == So_line) {
									recRecord.selectNewLine({
										sublistId: sublistId_gui_id
									});
									// Line Number
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_line_number",
										value: i + 1
									});
									// name
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "name",
										value: i + 1
									});
									// // 料號: 出貨單上的Item
									// strLog += "[3.料號:"+ SalesOrderRecord.getSublistValue({sublistId: 'item',fieldId: 'item',line: j})+"]\n";
									// recRecord.setCurrentSublistValue({
									// 	sublistId: sublistId_gui_id,
									// 	fieldId: "custrecord_2_inventory_item",
									// 	value: SalesOrderRecord.getSublistValue({
									// 		sublistId: 'item',
									// 		fieldId: 'item',
									// 		line: j
									// 	})
									// });
									// 品名:
									strLog += "[4.品名:" + SalesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: j }) + "]\n";
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_description",
										value: itemfulfillmentRecord.getSublistValue({
											sublistId: 'item',
											fieldId: 'description',
											line: i
										})
									});
									// 數量:
									var quantity = itemfulfillmentRecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'itemquantity',
										line: i
									});
									strLog += "[5.數量:" + quantity + "]\n";
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_quantity",
										value: quantity
									});
									// 單價:
									var rate = SalesOrderRecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'rate',
										line: j
									});
									strLog += "[6.單價:" + (rate * ex_rate).toFixed(3) + "]\n";
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_unit_price",
										value: (rate * ex_rate).toFixed(3)
									});
									// 明細行金額
									// 如果出貨單是全出  直接抓SaleOrder上面的金額
									if (So_quantity == quantity) {
										var So_amount = SalesOrderRecord.getSublistValue({
											sublistId: 'item',
											fieldId: 'amount',
											line: j
										});
										var line_amount = Math.round(So_amount * ex_rate);
									} else {
										var line_amount = Math.round(rate * quantity * ex_rate);
									}
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_line_amount",
										value: line_amount
									});

									amount += parseInt(line_amount);
									//amount += rate * quantity;
									// 明細行稅額
									// 如果出貨單是全出  直接抓SaleOrder上面的稅額
									var taxRate = SalesOrderRecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'taxrate1',
										line: j
									});
									//稅率
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_tax_rate",
										value: taxRate
									});
									if (So_quantity == quantity) {
										var So_tax = SalesOrderRecord.getSublistValue({
											sublistId: 'item',
											fieldId: 'tax1amt',
											line: j
										});
										var tax_amount = Math.round(So_tax * ex_rate);
									} else {
										strLog += "[7.taxRate:" + taxRate + "]\n";
										taxRate = parseFloat(taxRate) / 100;
										var tax_amount = Math.round(rate * quantity * taxRate * ex_rate);
									}
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_tax_amount",
										value: tax_amount
									});
									tax += parseInt(tax_amount);

									// 明細行總額
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_total_amount",
										value: parseInt(line_amount) + parseInt(tax_amount)
									});
									// 已折讓未稅金額
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_cm_gui_line_amt",
										value: 0
									});
									// 已折稅額
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_cm_gui_tax_amt",
										value: 0
									});
									// 未折讓金額
									recRecord.setCurrentSublistValue({
										sublistId: sublistId_gui_id,
										fieldId: "custrecord_2_undiscount_amt",
										value: line_amount
									});
									recRecord.commitLine({
										sublistId: sublistId_gui_id
									});
								}
							}
						}
						strLog += "(資料檢查)\n";
						// 銷售金額
						strLog += "[28.銷售金額:" + Math.round(amount) + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_sales_amt',
							value: Math.round(amount)
							//value: Math.round(amount * ex_rate)
						});

						// 明細未稅金額
						strLog += "[29.明細未稅金額:" + Math.round(amount) + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_lines_sales_total',
							value: Math.round(amount)
							//value:(amount * ex_rate).toFixed(2)
						});

						// 銷售稅額
						strLog += "[30.銷售稅額:" + Math.round(tax) + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_vat_io',
							value: Math.round(tax)//tax
							//value: Math.round(tax * ex_rate)//tax
						});

						// 明細稅額
						strLog += "[31.明細稅額:" + Math.round(tax) + "]\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_lines_vat_io_total',
							value: Math.round(tax)//tax
							//value: Math.round(tax * ex_rate)//tax
						});
						// 	銷售總額與明細含稅總額
						var totalAMT = Math.round(amount) + Math.round(tax);

						// 	明細含稅總額				
						recRecord.setValue({
							fieldId: 'custrecord_1_lines_total',
							value: totalAMT
							//value: parseFloat((amount * ex_rate).toFixed(2)) + Math.round(tax * ex_rate)//tax
						});

						// 	銷售總額
						recRecord.setValue({
							fieldId: 'custrecord_1_sales_total_amt',
							value: totalAMT
							//value:  Math.round(amount * ex_rate) + Math.round(tax * ex_rate)//tax
						});

						//勾稽餘額			
						recRecord.setValue({
							fieldId: 'custrecord_1_est_rcv_amt_remain',
							value: totalAMT
						});

						// 	未折讓金額
						strLog += "[32.未折讓金額:" + Math.round(amount) + "]====\n";
						recRecord.setValue({
							fieldId: 'custrecord_1_undiscount_amt',
							value: Math.round(amount)
							//value:  Math.round(amount * ex_rate)
						});

						var recID = recRecord.save({
							enableSourcing: false,
							ignoreMandatoryFields: true
						});

						if (recID) {
							//更新發票號碼
							var gui_no = updateGui_id(recID, nowYear, nowMonth, nowDate, So_subsidiary);
							if (gui_no != "" && gui_no != undefined) {
								// 更新fulfillment 已開立銷項發票
								updatefillment_attached_gui_id(result.getValue({ name: 'internalid' }), recID);
								strLog = "發票號碼 " + gui_no + "已開立完成";
							} else {
								//如果取號失敗  刪除銷項發票
								DeleteRecRecord(recID);
								strLog += "發票取號失敗，請確認";
							}
						}
						log.debug("流程Log", strLog);
						strLog = "";
					} catch (error) {
						strErrorLog += "Record.Load寫入錯誤-[" + error.name + "]-錯誤訊息[" + error.message + "]\n";
					}
					return true;

				} else {
					if (guiforminvoice) {
						strErrorLog += result.getValue({ name: 'tranid' }) + "出貨單號對應的invoice單號:" + fillmentNO_oninvoice + "已產生銷項發票\n";
					} else {
						strErrorLog += result.getValue({ name: 'tranid' }) + "出貨單號已產生銷項發票\n";
					}
					return true;
				}
			});

			if (strErrorLog != "") {
				SendEmail(strErrorLog);
				log.error("錯誤Log", strErrorLog);
				log.error("流程Log", strLog);
			}

		}

		//#region Function
		//數字轉字串，並往前補0至8位數 舊的function
		/*function paddingTo8(num) {
			try {
				var value = num.toString();
				if (value.length < 8) {
					for (var i = 0; i < (8 - value.length); i++) {
						value = "0" + value;
					}
				}
				return value;
			} catch (error) {
				strErrorLog += "(Function)paddingTo8錯誤-["+error.name+"]-錯誤訊息["+error.message+"]\n";
			}
		} */

		//搜尋開立人
		function searchissuer (custbody_gv_print_type){
			var emailsender = "";
			var customrecord_ev_print_typeSearchObj = search.create({
				type: "customrecord_ev_print_type",
				filters:
				[
					["internalid","anyof",custbody_gv_print_type]
				],
				columns:
				[
				   search.createColumn({name: "custrecord_ev_email_sender", label: "Email寄件人"}),
				   search.createColumn({
					  name: "name",
					  sort: search.Sort.ASC,
					  label: "Name"
				   })
				]
			 });
			 customrecord_ev_print_typeSearchObj.run().each(function (result) {
				emailsender = result.getValue({ name: "custrecord_ev_email_sender" });
			});
			log.debug("email_sender：",emailsender);
			return emailsender;
		}
		// 發票號碼前面補0, 新的function
		function padding(numb, strLength) {
			var str = '' + numb;
			while (str.length < strLength) {
				str = '0' + str;
			}
			return str;
		}
		//更新發票簿資料
		function saveGuiBook(gui_book_id, now_number, date, gui_cur_datetime) {
			var bookRecord = record.load({
				type: 'customrecord_ev_gui_books_all',
				id: gui_book_id,
				isDynamic: false
			});
			if (gui_cur_datetime == bookRecord.getValue("custrecord_19_gui_cur_datetime")) {
				try {
					bookRecord.setValue({
						fieldId: 'custrecord_19_gui_cur_number',
						value: padding(now_number, 8)
					});
					bookRecord.setValue({
						fieldId: 'custrecord_19_gui_cur_date',
						value: date
					});
					bookRecord.setValue({
						fieldId: 'custrecord_19_gui_cur_datetime',
						value: new util.dateObj().getSystime()
					});
					//更新回寫該折讓簿冊的目前使用號碼
					bookRecord.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});
				} catch (error) {
					log.debug("寫入發票簿錯誤", error.message);
					return false;
				}
				return true;
			} else {
				return false;
			}
		}
		//隨機碼
		function getRandonCode() {
			try {
				var randoncode = '';
				for (var i = 0; i < 4; i++) {
					randoncode = randoncode + (Math.floor(Math.random() * 9)).toString();
				}

				return randoncode;
			} catch (error) {
				strErrorLog += "(Function)getRandonCode錯誤-[" + error.name + "]-錯誤訊息[" + error.message + "]\n";
			}
		}
		//Email
		function SendEmail(strErrorLog) {
			var scriptObj = runtime.getCurrentScript();
			util.ScriptErrorSendMailToOwner(scriptObj.id, "隨貨產生銷項發票", strErrorLog);
		}

		function get_GUI_No(nowYear, nowMonth, nowDate, So_subsidiary) {
			var cur_number = '';
			var word = '';
			var start_number = '';
			var end_number = '';
			var gui_book_id = '';
			var gui_no;	//custrecord_1_gui_no
			var registration_number;
			var now_number;	//發票號碼計算
			var bookObj;
			var errMsg;
			var gui_cur_datetime;

			var customrecord_ev_gui_books_allSearchObj = search.create({
				type: "customrecord_ev_gui_books_all",
				filters:
					[
						["custrecord_19_gui_use_type", "anyof", 3], //開立方式為隨貨開立
						"AND",
						["custrecord_19_gui_year", "equalto", nowYear],
						"AND",
						["custrecord_19_gui_start_month", "lessthanorequalto", nowMonth],
						"AND",
						["custrecord_19_gui_end_month", "greaterthanorequalto", nowMonth],
						"AND",
						["custrecord_19_default_book", "is", "T"]
					],
				columns:
					[
						search.createColumn({
							name: "custrecord_19_gui_cur_number",
							label: "目前使用號碼"
						}),
						search.createColumn({
							name: "custrecord_19_gui_word",
							label: "字軌"
						}),
						search.createColumn({
							name: "custrecord_19_gui_start_number",
							label: "起始號碼"
						}),
						search.createColumn({
							name: "custrecord_19_gui_end_number",
							label: "起始號碼"
						}),
						search.createColumn({
							name: "custrecord_19_registration_number",
							label: "稅籍編號"
						}),
						search.createColumn({
							name: "custrecord_19_gui_type",
							label: "發票簿類別"
						}),
						search.createColumn({
							name: "internalid",
							label: "Internal ID"
						}),
						search.createColumn({
							name: "custrecord_19_gui_cur_date"
						}),
						search.createColumn({
							name: "custrecord_19_gui_cur_datetime"
						})
					]
			});
			var dFilters = customrecord_ev_gui_books_allSearchObj.filters;
			if (util.fun_IsOneWorld()) {
				dFilters.push(search.createFilter({ name: 'custrecord_19_subsidiary', operator: "ANYOF", values: So_subsidiary }));
			}
			customrecord_ev_gui_books_allSearchObj.filters = dFilters;
			if (customrecord_ev_gui_books_allSearchObj.runPaged().count == 1) {
				customrecord_ev_gui_books_allSearchObj.run().each(function (result) {
					try {
						cur_number = result.getValue({
							name: 'custrecord_19_gui_cur_number'
						});
						word = result.getText({
							name: 'custrecord_19_gui_word'
						});
						start_number = result.getValue({
							name: 'custrecord_19_gui_start_number'
						});
						end_number = result.getValue({
							name: 'custrecord_19_gui_end_number'
						});
						gui_book_id = result.getValue({
							name: 'internalid'
						});
						registration_number = result.getValue({
							name: 'custrecord_19_registration_number'
						});
						gui_cur_datetime = result.getValue({
							name: 'custrecord_19_gui_cur_datetime'
						});

					} catch (error) {
						errMsg = "Search變數塞資料錯誤-[" + error.name + "]-錯誤訊息[" + error.message + "]";
					}
					return false;
				});
				if (cur_number >= end_number) {
					errMsg = "發票簿冊剩餘發票張數不足，請到簿冊別重新挑選";
				}
				//產生發票號碼
				if (cur_number != "" && cur_number != null) {
					now_number = parseInt(cur_number, 10) + 1;
				} else {
					now_number = parseInt(start_number, 10);
				}
				gui_no = word + padding(now_number, 8);

				bookObj = {
					cur_number: cur_number,
					gui_book_id: gui_book_id,
					registration_number: registration_number,
					gui_no: gui_no
				}
				try {
					if (!saveGuiBook(gui_book_id, now_number, nowDate, gui_cur_datetime)) {
						bookObj = get_GUI_No(nowYear, nowMonth, nowDate, So_subsidiary);
					}
				} catch (error) {
					bookObj = get_GUI_No(nowYear, nowMonth, nowDate, So_subsidiary);
				}

			} else {
				errMsg = "發票簿錯誤-[發票簿Search數量]" + customrecord_ev_gui_books_allSearchObj.runPaged().count + "";
			}
			if (errMsg) {
				return errMsg;
			} else {
				return bookObj;
			}

		}
		function updatefillment_attached_gui_id(fulfillid, recID) {
			try {
				var fulfillRecord = record.load({
					type: record.Type.ITEM_FULFILLMENT,
					id: fulfillid
				});

				fulfillRecord.setValue({
					fieldId: 'custbody_gv_attached_gui_id',
					value: recID
				});

				fulfillRecord.save();
			} catch (error) {
				log.debug(error.name, error.message);
				setTimeout(fulfillid, recID, 10000);
			}
		}
		// 刪除銷項發票
		function DeleteRecRecord(recID) {
			//銷項發票明細
			var recRecord = record.load({
				type: 'customrecord_ev_rec_invoices_all',
				id: recID,
				isDynamic: false
			});
			if (recRecord) {
				var trxn_noID = "recmachcustrecord_2_gui_id";                                     // 銷項發票資訊的sublist ID
				var LineCount = recRecord.getLineCount({ "sublistId": trxn_noID });                 // 銷項發票資訊的sublist數
				for (var i = 0; i < LineCount; i++) {
					var ar_id = recRecord.getSublistValue({
						sublistId: trxn_noID,
						fieldId: 'id',
						line: i
					});
					if (ar_id) {
						record.delete({ type: 'customrecord_ev_rec_invoice_lines_all', id: ar_id });
					}
				}
				record.delete({
					type: "customrecord_ev_rec_invoices_all",
					id: recID,
				});
			}
		}
		function setTimeout(fulfillid, recID, milliseconds) {
			var date = new Date();
			date.setMilliseconds(date.getMilliseconds() + milliseconds);
			while (new Date() < date) {
			}
			updatefillment_attached_gui_id(fulfillid, recID)
		}
		function searchinvoice(fillmentNO_oninvoice) {
			var gui_no = "";
			var invoiceSearchObj = search.create({
				type: "invoice",
				filters:
					[
						["type", "anyof", "CustInvc"],
						"AND",
						["numbertext", "is", fillmentNO_oninvoice]
					],
				columns:
					[
						search.createColumn({
							name: "custrecord_ev_inv_h_gui_no",
							join: "CUSTBODY_GV_HEADER_ID",
							label: "已開立發票號碼"
						})
					]
			});
			invoiceSearchObj.run().each(function (result) {
				gui_no = result.getValue({ name: "custrecord_ev_inv_h_gui_no", join: "CUSTBODY_GV_HEADER_ID" });
				return true;
			});
			if (gui_no != "") {
				return true;
			} else {
				return false;
			}
		}
		function updateGui_id(recID, nowYear, nowMonth, nowDate, So_subsidiary) {
			try {
				//取得發票號碼
				var gui_no = get_GUI_No(nowYear, nowMonth, nowDate, So_subsidiary);
				if (typeof (gui_no) == "string") {
					log.debug("錯誤訊息", gui_no);
					var scriptObj = runtime.getCurrentScript();
					util.ScriptErrorSendMailToOwner(scriptObj.id, "隨貨產生銷項發票", "發票簿錯誤-[發票簿張數不足]");
					return "";
				} else {
					var recRecord = record.load({
						type: "customrecord_ev_rec_invoices_all",
						id: recID
					});
					//稅籍編號
					recRecord.setValue({
						fieldId: 'custrecord_1_registration_number',
						value: gui_no['registration_number'],
						ignoreFieldChange: true
					});
					// 發票簿冊
					recRecord.setValue({
						fieldId: 'custrecord_1_gui_book_id',
						value: gui_no['gui_book_id'],
						ignoreFieldChange: true
					});
					//發票號碼
					recRecord.setValue({
						fieldId: 'custrecord_1_gui_no',
						value: gui_no['gui_no']
					});
					//NAME  同發票號碼
					recRecord.setValue({
						fieldId: 'name',
						value: gui_no['gui_no']
					});
					// GUI_CONFIRMED
					recRecord.setValue({
						fieldId: 'custrecord_1_gui_confirmed',
						value: true
					});
					recRecord.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});
					return gui_no['gui_no'];
				}

			} catch (error) {
				log.error(error.name, error.message)
			}
		}
		return {
			execute: execute
		};
		//#endregion
	});