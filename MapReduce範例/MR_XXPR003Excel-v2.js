/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */
define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log', './commonCustFolderApi.js'],

	function (encode, file, search, format, config, record, email, render, runtime, log, custfolder) {

	function getInputData(context) {
		try {
			var scriptObj = runtime.getCurrentScript();
			
			var currentUser = runtime.getCurrentUser().id; 			
			
			var defaultPaymentDate = scriptObj.getParameter({
					name: 'custscript_xxpr003_paymentdate_v2'
				});
			var defaultAccount = scriptObj.getParameter({
					name: 'custscript_xxpr003_account_v2'
				});
			var defaultCurrency = scriptObj.getParameter({
					name: 'custscript_xxpr003_currency_v2'
				});
			var defaultEntityType = scriptObj.getParameter({
					name: 'custscript_xxpr003_type_v2'
				});
			var defaultPaymentMethod = scriptObj.getParameter({
					name: 'custscript_xxpr003_method_v2'
				});
			var defaultAlone = scriptObj.getParameter({
					name: 'custscript_xxpr003_payalone_v2'
				});

			if (defaultEntityType == '1')
				//vendor
			{
				var vendorPaymentSearch = search.create({
						type: "vendorpayment",
						filters:
						[
							["type", "anyof", "VendPymt"],
							"AND",
							["mainline", "is", "F"],
							"AND",
							["trandate", "on", defaultPaymentDate],
							"AND",
							["accountmain", "anyof", defaultAccount],
							"AND",
							["appliedtotransaction.type", "anyof", "VendBill"],
							"AND",
							["custbody_4601_entitytype", "anyof", defaultEntityType],
							"AND",
							["custbodyast_payment_method", "anyof", defaultPaymentMethod],
							"AND",
							["custbodyast_pay_each_document_alone", "anyof", defaultAlone],
							"AND",
							["currency", "anyof", defaultCurrency]//,
							//"AND", 
							//["createdby","anyof",currentUser]

						],
						columns:
						['internalid',
							'entity',
							'accountmain',
							'currency',
							'exchangerate',
							'transactionnumber',
							'tranid',
							'appliedtotransaction',
							'appliedtoforeignamount',
							'statusref',
							'vendor.altname',
							'vendor.entityid',
							//'vendor.vatregnumber',
							'vendor.custentityast_account_no',
							'vendor.custentityast_bank_charge_bearer',
							'vendor.custentityvendor_summary_report',
							'appliedToTransaction.type',
							'appliedToTransaction.trandate',
							'appliedToTransaction.duedate',
							'appliedToTransaction.fxamount',
							'appliedToTransaction.fxamountremaining',
							'appliedToTransaction.discountamount',
							//'appliedToTransaction.terms',
							'custbodyast_payment_method',
							'appliedToTransaction.custbodyast_tran_account_name',
							'account',
							'appliedToTransaction.custbodyast_bank_charge_bearer'

						]
					});
			} else if (defaultEntityType == '3')
				//employee
			{
				var vendorPaymentSearch = search.create({
						type: "vendorpayment",
						filters:
						[
							["type", "anyof", "VendPymt"],
							"AND",
							["mainline", "is", "F"],
							"AND",
							["trandate", "on", defaultPaymentDate],
							"AND",
							["accountmain", "anyof", defaultAccount],
							"AND",
							["custbody_4601_entitytype", "anyof", defaultEntityType],
							"AND",
							["appliedtotransaction.type", "anyof", "ExpRept"],
							"AND",
							["currency", "anyof", defaultCurrency]//,
							//"AND", 
							//["createdby","anyof",currentUser]

						],
						columns:
						['internalid',
							'entity',
							'accountmain',
							'currency',
							'exchangerate',
							'transactionnumber',
							'tranid',
							'appliedtotransaction',
							'appliedtoforeignamount',
							'statusref',
							'employee.altname',
							'employee.entityid',
							'employee.custentityast_account_no',
							'appliedToTransaction.type',
							'appliedToTransaction.trandate',
							'appliedToTransaction.duedate',
							'appliedToTransaction.fxamount',
							'appliedToTransaction.fxamountremaining',
							'appliedToTransaction.discountamount',
							//'appliedToTransaction.terms',
							'custbodyast_payment_method',
							'account',
							'appliedToTransaction.custbodyast_bank_charge_bearer'
						]
					});

			}
			return vendorPaymentSearch;
		} catch (e) {
			log.debug(e.name, e.message)
		}

	}

	function map(context) {
		try {
			var obj = JSON.parse(context.value);
			var internalid = obj.values.internalid.value;
			var entity = obj.values.entity.text;
			var accountmain = obj.values.accountmain.text;
			var currency = obj.values.currency.text;
			var exchangerate = obj.values.exchangerate;
			var tranid = obj.values.tranid;
			var transactionnumber = obj.values.transactionnumber;
			var appliedtotransaction = obj.values.appliedtotransaction.text;
			var appliedtotransactionid = obj.values.appliedtotransaction.value;
			var appliedtoforeignamount = obj.values.appliedtoforeignamount;
			var statusref = obj.values.statusref;
			var type = obj.values['type.appliedToTransaction'].text;
			var trandate = obj.values['trandate.appliedToTransaction'];
			var duedate = obj.values['duedate.appliedToTransaction'];
			var fxamount = obj.values['fxamount.appliedToTransaction'];
			var fxamountremaining = obj.values['fxamountremaining.appliedToTransaction'];
			var discountamount = obj.values['discountamount.appliedToTransaction'];

			var scriptObj = runtime.getCurrentScript();
			var defaultEntityType = scriptObj.getParameter({
					name: 'custscript_xxpr003_type_v2'
				});
			if (defaultEntityType == '1') {
				//vendor
				//var vendorname = obj.values['altname.vendor'];
				var vendorid = obj.values['entityid.vendor'];
				var custentityvendor_summary_report = obj.values['custentityvendor_summary_report.vendor'];
				if (custentityvendor_summary_report) {
					var vendorname = obj.values['altname.vendor'] + ' ' + obj.values['custbodyast_tran_account_name.appliedToTransaction'];
				} else {
					var vendorname = obj.values['altname.vendor'];
				}
				//var vatregnumber = obj.values['vatregnumber.vendor'];
				//var terms = obj.values['terms.appliedToTransaction'].text;
				var custbodyast_payment_method = obj.values.custbodyast_payment_method.text;
				//var custbodyast_tran_pay_each_document = obj.values.custbodyast_tran_pay_each_document.value;
				var entitytype = 'Vendor';
				//var chargebearer_old = obj.values['custentityast_bank_charge_bearer.vendor'].text;
				var chargebearer = obj.values['custbodyast_bank_charge_bearer.appliedToTransaction'].text;
				var custentityast_account_no = obj.values['custentityast_account_no.vendor'];
				//var custbodyast_tran_account_name = obj.values['custbodyast_tran_account_name.appliedToTransaction'];
			} else if (defaultEntityType == '3') {
				//employee
				var vendorname = obj.values['altname.employee'];
				var vendorid = obj.values['entityid.employee'];
				//var vatregnumber = obj.values['entityid.employee'];
				var custbodyast_tran_pay_each_document = '';
				var custbodyast_payment_method = '';
				var terms = '';
				var entitytype = 'Employee'
				var chargebearer = '';
				var custentityast_account_no = obj.values['custentityast_account_no.employee'];
			}
			var accountexists = (custentityast_account_no ? 'Y' : 'N');
			var invoiceObj = getInvoiceData(appliedtotransactionid);
			var gui_no = invoiceObj['gui_no'];
			var other_no = invoiceObj['other_no'];
			var account = obj.values.account.text;

			context.write({
				key: {
					'entitytype': entitytype,
					'accountmain': accountmain,
					'currency': currency,
					'custbodyast_payment_method': custbodyast_payment_method
				},
				value: {
					'entity': entity,
					'currency': currency,
					'custbodyast_payment_method': custbodyast_payment_method,
					'custbodyast_tran_pay_each_document': custbodyast_tran_pay_each_document,
					'exchangerate': exchangerate,
					'tranid': tranid,
					'transactionnumber': transactionnumber,
					'appliedtotransaction': appliedtotransaction,
					'appliedtoforeignamount': appliedtoforeignamount,
					'statusref': statusref,
					'vendorname': vendorname,
					'vendorid': vendorid,
					//'vatregnumber': vatregnumber,
					'type': type,
					'trandate': trandate,
					'duedate': duedate,
					'fxamount': fxamount,
					'fxamountremaining': fxamountremaining,
					'discountamount': discountamount,
					//'terms': terms,
					'chargebearer': chargebearer,
					'accountexists': accountexists,
					'gui_no': gui_no,
					'other_no': other_no,
					'account': account
				}
			});
		} catch (e) {
			log.debug(e.name, e.message);
		}
		//}
	}

	function reduce(context) {
		try {
			context.write({
				key: context.key,
				value: context.values
			});
		} catch (e) {
			log.debug(e.name, e.message);
		}

	}

	function summarize(context) {
		try {
			var scriptObj = runtime.getCurrentScript();
			context.output.iterator().each(function (key, value) {
				/*
				log.debug({
					title: ' summary.output.iterator',
					details: 'key: ' + key + ' / value: ' + value
				});
				*/
			});
			var folderId = custfolder.getUserFolder(runtime.getCurrentUser().name, '客製報表');
			runExcel(context, scriptObj, folderId);
		} catch (e) {
			log.debug(e.name, e.message);
		}
	}

	function runExcel(context, scriptObj, folderId) {
		try {
			var defaultPaymentDate = scriptObj.getParameter({
					name: 'custscript_xxpr003_paymentdate_v2'
				});
			var defaultAccount = scriptObj.getParameter({
					name: 'custscript_xxpr003_account_v2'
				});
			var defaultCurrency = scriptObj.getParameter({
					name: 'custscript_xxpr003_currency_v2'
				});
			var defaultEntityType = scriptObj.getParameter({
					name: 'custscript_xxpr003_type_v2'
				});
			var defaultPaymentMethod = scriptObj.getParameter({
					name: 'custscript_xxpr003_method_v2'
				});

			var fieldSummary = ['Currency', 'Document Count', 'Original Amount', 'Amount Due', 'Payment'];
			var fieldNames = ['Vendors',
				'Vendor ID',
				//'Tax Reg. Number',
				'Account',
				'Document Number',
				//'Payment Term',
				'Type',
				'Reference Number',
				'Invoice Date',
				'Date Due',
				//'Currency',
				'Exchange Rate',
				'Original Amount',
				'Bank Charge Bearer',
				'Amount Due',
				//'DISC. TAKEN',
				'Payment',
				'Bank Account',
				'發票號碼',
				'其他憑證號碼'];
			var userObj = runtime.getCurrentUser();
			var date = new Date();
			var tw = format.format({
					value: date,
					type: format.Type.DATETIME,
					timezone: format.Timezone.ASIA_TAIPEI
				});
			tw = new Date(tw);
			var year = tw.getFullYear();
			var month = (tw.getMonth() + 1 < 10 ? '0' : '') + (tw.getMonth() + 1).toString();
			var day = (tw.getDate() < 10 ? '0' : '') + (tw.getDate()).toString();
			var hour = (tw.getHours() < 10 ? '0' : '') + (tw.getHours()).toString();
			var minute = (tw.getMinutes() < 10 ? '0' : '') + (tw.getMinutes()).toString();
			var second = (tw.getSeconds() < 10 ? '0' : '') + (tw.getSeconds()).toString();
			var summaryDocumentCnt = 0;
			var summaryOriginalAmt = 0;
			var summaryAmountDue = 0;
			var summaryPayment = 0;
			var summaryDiscTaken = 0;
			var entitytype;
			var accountmain;
			var currency;
			var custbodyast_payment_method;
			var configRecObj = config.load({
					type: config.Type.COMPANY_INFORMATION
				});
			var companyName = configRecObj.getValue({
					fieldId: 'companyname'
				});

			context.output.iterator().each(function (key) {
				entitytype = JSON.parse(key).entitytype;
				accountmain = JSON.parse(key).accountmain;
				currency = JSON.parse(key).currency;
				custbodyast_payment_method = JSON.parse(key).custbodyast_payment_method;
				return true;
			});

			var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
			xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
			xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
			xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
			xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
			xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
			xmlString += '<Styles>';
			xmlString += '<Style ss:ID="title1">';
			xmlString += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="title2">';
			xmlString += '<Alignment ss:Vertical="Center"/>';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell1">';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell2">';
			xmlString += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>'
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '<NumberFormat ss:Format="#,##0_);[Red]\(#,##0\)"/>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell3">';
			xmlString += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>';
			xmlString += '<NumberFormat ss:Format="#,##0_);[Red]\(#,##0\)"/>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell4">';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell5">';
			xmlString += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell6">';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '<NumberFormat ss:Format="#,##0_ "/>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="cell7">';
			xmlString += '<Borders>';
			xmlString += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
			xmlString += '</Borders>';
			xmlString += '<NumberFormat ss:Format="#,##0.00_ "/>';
			xmlString += '</Style>';
			xmlString += '</Styles>';

			xmlString += '<Worksheet ss:Name="Sheet1">';
			xmlString += '<Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="54" ss:DefaultRowHeight="16.5">';
			//xmlString += '<Column ss:Index="2" ss:AutoFitWidth="0" ss:Width="180"/><Column ss:AutoFitWidth="0" ss:Width="91.5"/><Column ss:Index="6" ss:AutoFitWidth="0" ss:Width="93.75"/><Column ss:AutoFitWidth="0" ss:Width="66.75"/><Column ss:AutoFitWidth="0" ss:Width="96"/><Column ss:Index="11" ss:AutoFitWidth="0" ss:Width="75.75"/>'
			xmlString += '<Row>';
			xmlString += '<Cell ss:MergeAcross="15" ss:StyleID="title1"><Data ss:Type="String">' + companyName + '</Data></Cell>';
			xmlString += '</Row>';
			xmlString += '<Row>';
			xmlString += '<Cell ss:MergeAcross="15" ss:StyleID="title1"><Data ss:Type="String">批次付款Summary Report</Data></Cell>';
			xmlString += '</Row>';
			xmlString += '<Row>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">Date:</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="1" ss:StyleID="cell1"><Data ss:Type="String">' + defaultPaymentDate + '</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="9" ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">Entity Type:</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="1" ss:StyleID="cell1"><Data ss:Type="String">' + entitytype + '</Data></Cell>';
			xmlString += '</Row>';
			xmlString += '<Row>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">Account:</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="1" ss:StyleID="cell1"><Data ss:Type="String">' + accountmain + '</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="9" ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">Payment Method:</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="1" ss:StyleID="cell1"><Data ss:Type="String">' + custbodyast_payment_method + '</Data></Cell>';
			xmlString += '</Row>';
			xmlString += '<Row>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">Currency:</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="1" ss:StyleID="cell1"><Data ss:Type="String">' + currency + '</Data></Cell>';
			xmlString += '<Cell ss:MergeAcross="12" ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			xmlString += '</Row><Row></Row>';

			//Summary
			xmlString += '<Row>';
			for (var i = 0; i < fieldSummary.length; i++) {
				xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + fieldSummary[i] + '</Data></Cell>';
			}
			xmlString += '</Row>';

			context.output.iterator().each(function (key, value) {
				var details = JSON.parse(value);

				for (var i = 0; i < details.length; i++) {
					summaryOriginalAmt += Number(JSON.parse(details[i]).fxamount) || 0;
					summaryAmountDue += Number(JSON.parse(details[i]).fxamountremaining) || 0;
					summaryPayment += Number(JSON.parse(details[i]).appliedtoforeignamount) || 0;
					summaryDiscTaken += Number(JSON.parse(details[i]).discountamount) || 0;
				}
				summaryDocumentCnt = details.length;
				return true;
			});

			//Summary Data
			xmlString += '<Row>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + currency + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryDocumentCnt + '</Data></Cell>';
			if (currency === 'TWD') {
				xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryOriginalAmt + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryAmountDue + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryPayment + '</Data></Cell>';
			} else {
				xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryOriginalAmt + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryAmountDue + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryPayment + '</Data></Cell>';
			}

			xmlString += '</Row><Row></Row>'

			//detail
			//detail title
			xmlString += '<Row>';
			for (var i = 0; i < fieldNames.length; i++) {
				xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + fieldNames[i] + '</Data></Cell>';
			}
			xmlString += '</Row>';
			//detail data
			context.output.iterator().each(function (key, value) {
				var details = JSON.parse(value);
				for (var i = 0; i < details.length; i++) {
					null;
					xmlString = writeXmlDetailData(JSON.parse(details[i]), xmlString, currency);
				}
				return true;
			});

			//detail Total
			xmlString += '<Row>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">Total</Data></Cell>';
			if (currency === 'TWD') {
				xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryOriginalAmt + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryAmountDue + '</Data></Cell>';
				//xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryDiscTaken + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + summaryPayment + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			} else {
				xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryOriginalAmt + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryAmountDue + '</Data></Cell>';
				//xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryDiscTaken + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + summaryPayment + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			}
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String"></Data></Cell>';
			xmlString += '</Row><Row></Row><Row></Row><Row></Row>';			
			
			//簽核欄位
			xmlString += '<Row>';
			xmlString += '<Cell ss:MergeAcross="6" StyleID="cell1"><Data ss:Type="String">Approved by:</Data></Cell>';			
			xmlString += '<Cell ss:MergeAcross="4" StyleID="cell1"><Data ss:Type="String">Reviewed by:</Data></Cell>';
	     	xmlString += '<Cell ss:MergeAcross="4" StyleID="cell1"><Data ss:Type="String">Prepared by:</Data></Cell>';
			xmlString += '</Row>';
			xmlString += '</Table></Worksheet></Workbook>';
			//encode contents

			var base64EncodedString = encode.convert({
					string: xmlString,
					inputEncoding: encode.Encoding.UTF_8,
					outputEncoding: encode.Encoding.BASE_64
				});
			//log.debug('runtime user',runtime.getCurrentUser().name);
			var usr = runtime.getCurrentUser().name;
			//create file
			var xlsFile = file.create({
					name: '批次付款Summary Report' + year + month + day + hour + minute + second + '_' + usr + '.xls',
					fileType: 'EXCEL',
					contents: base64EncodedString,
					folder: folderId
				});
			xlsFile.save();
		} catch (e) {
			log.debug(e.name, e.message);
		}
	}

	function writeXmlDetailData(detail, xmlString, currency) {
		xmlString += '<Row>'
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.vendorname + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.vendorid + '</Data></Cell>';
		//xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.vatregnumber + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.account + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.tranid + '</Data></Cell>';
		//xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.terms + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.type + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.appliedtotransaction + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.trandate + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.duedate + '</Data></Cell>';
		//xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.currency + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + detail.exchangerate + '</Data></Cell>';

		if (currency === 'TWD') {
			xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + detail.fxamount + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.chargebearer + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + detail.fxamountremaining + '</Data></Cell>';
			//xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + detail.discountamount + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell6"><Data ss:Type="Number">' + detail.appliedtoforeignamount + '</Data></Cell>';

		} else {
			xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + detail.fxamount + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.chargebearer + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + detail.fxamountremaining + '</Data></Cell>';
			//xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + detail.discountamount + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="cell7"><Data ss:Type="Number">' + detail.appliedtoforeignamount + '</Data></Cell>';
		}
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.accountexists + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.gui_no + '</Data></Cell>';
		xmlString += '<Cell ss:StyleID="cell1"><Data ss:Type="String">' + detail.other_no + '</Data></Cell>';
		xmlString += '</Row>';
		return xmlString;
	}

	function getInvoiceData(tranid){
        try {  
            var invoiceObj;	
            var sales_no = "";
            var gui_date="";
			var gui_no = "";
			var other_no = "";
            if(tranid){
                var invoiceSearchObj = search.create({
                    type: "customrecord_ev_pay_invoices_all",
                    filters:
                    [
                        ["custrecord_10_trxn_no","is",tranid]
                    ],
                    columns: ['custrecord_10_sales_no',
                        search.createColumn({
                            name: "formulatext4",
                            formula: "TO_CHAR({custrecord_10_gui_date},'yyyy/mm/dd')"
                        }),                    
						'custrecord_10_gui_no',
						'custrecord_10_other_desc'
                    ]
                });	

                invoiceSearchObj.run().each(function(result){
                    sales_no = result.getValue("custrecord_10_sales_no");
                    gui_date = result.getValue({name: 'formulatext4'});		
					gui_no = result.getValue("custrecord_10_gui_no");
					other_no = result.getValue("custrecord_10_other_desc");
                    return true;
                });
            }					
            invoiceObj = {
                sales_no : sales_no,
                gui_date : gui_date,
				gui_no : gui_no,
				other_no : other_no
            }
            return invoiceObj;	
        } catch (error) {
            log.error("getInvoiceData"+error.name,error.message);
        }            		
	}

	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};

});
