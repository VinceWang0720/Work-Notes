/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */
define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log','./commonUtil', './commonCustFolderApi'],

function(encode, file, search, format, config, record, email, render, runtime, log,util,custfolder) {

	function getInputData(context) {
		try {	
			var scriptObj = runtime.getCurrentScript();
			var datefrom = scriptObj.getParameter({name: 'custscript_mr_xxor003_datefrom'});
			var dateto = scriptObj.getParameter({name: 'custscript_mr_xxor003_dateto'});
			var invoiceno = scriptObj.getParameter({name: 'custscript_mr_xxor003_invoiceno'});
			var creditmemono = scriptObj.getParameter({name: 'custscript_mr_xxor003_creditmemono'});
			var customerid = scriptObj.getParameter({name: 'custscript_mr_xxor003_customerid'});   
			var sono = scriptObj.getParameter({name: 'custscript_mr_xxor003_sono'});
			
			var transactionSearchObj = search.create({
				type: "transaction",
				filters:
				[
					["mainline","is","F"], 
					"AND", ["trandate","onorafter",datefrom], 
					"AND", ["trandate","onorbefore",dateto], 
					"AND", ["taxline","is","F"], 
					"AND", ["cogs","is","F"], 
					"AND", ["shipping","is","F"], 
					"AND", ["quantity","notequalto","0"], 
					"AND", ["type","anyof","CustCred","CustInvc","CashSale"],
					"AND", 
      		["accounttype","anyof","Income"]
				],
				columns:
				[
					search.createColumn({name: "internalid",label: "Internal ID"}),
					search.createColumn({name: "type", label: "Type"}),
					search.createColumn({name: "entityid",join: "customer",label: "Internal ID"}),
					search.createColumn({name: "altname", join: "customer",label: "Name"}),
					search.createColumn({name: "tranid", label: "Document Number"}),
					search.createColumn({name: "trandate", label: "Date"}),
					search.createColumn({name: "createdfrom", label: "Created From"}),
					search.createColumn({name: "salesrep", join: "customer", label: "Sales Rep"}),
					search.createColumn({name: "department", label: "Department"}),
					search.createColumn({name: "quantity", label: "Quantity"}),
					search.createColumn({name: "amount", label: "Amount"}),
					search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
					search.createColumn({name: "exchangerate", label: "Exchange Rate"}),
					search.createColumn({name: "taxamount", label: "Amount (Tax)"}),
					search.createColumn({name: "grossamount", label: "Amount (Gross)"}),
					search.createColumn({name: "currency", label: "Currency"}),
					search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
					search.createColumn({name: "terms",join: "customer",label: "Terms"}),
					search.createColumn({name: "internalid",join: "item",label: "Internal ID"}),
					search.createColumn({name: "itemid",join: "item",label: "Internal ID"}),
					search.createColumn({name: "salesdescription",join: "item",label: "Sales Description (Translated)"}),
					search.createColumn({name: "class",join: "item",label: "Class"}),
					search.createColumn({name: "custitem_aic_business_unit", join: "item", label: "G_Business Unit"}),
					search.createColumn({name: "custitem_plm_product_line", join: "item", label: "G_PRODUCT_LINE"}),
					search.createColumn({name: "otherrefnum", label: "PO/Check Number"}),
					search.createColumn({name: "location", label: "Location"}),
					search.createColumn({name: "memomain", label: "Memo (Main)"}),
					search.createColumn({name: "custentity_aorcredit", join: "customer",label: "Name"}),
					search.createColumn({name: "custentity_insurancecredit", join: "customer",label: "Name"}),
					search.createColumn({name: "custentity_creditlimit", join: "customer",label: "Name"}),
					search.createColumn({name: "custitem_brand", join: "item",label: "Name"}),
					search.createColumn({name: "csegitem_category1", join: "item",label: "Name"}),
					search.createColumn({name: "csegitem_category2", join: "item",label: "Name"}),
					search.createColumn({name: "csegitem_category3", join: "item",label: "Name"}),
					search.createColumn({name: "custitem_program", join: "item",label: "Name"}),
					search.createColumn({name: "line",label: "Name"}),
					//search.createColumn({name: "costestimate",label: "Name"}),
					search.createColumn({name: "formulatext",formula: "TO_CHAR({trandate},'yyyy/mm/dd')"}),
					search.createColumn({name: "cseg_aic_marketcode", join: "customer", label: "G_Market Code"}),
					search.createColumn({name: "custitem_aic_product_marketing_name", join: "item", label: "G_Product Marketing Name"}),
					search.createColumn({name: "createdfrom", join: "createdFrom", label: "Created From"}),
				]
			 });
			 var dFilters = transactionSearchObj.filters;
			 if (creditmemono)
				dFilters.push(addFilter('tranid','', "is", invoiceno));
			 if (invoiceno)
				dFilters.push(addFilter('tranid','', "is", creditmemono));
			 if (customerid)
				dFilters.push(addFilter('entity','', "is", customerid));
			 if (sono)
				dFilters.push(addFilter('tranid','createdfrom', "is", sono));
			transactionSearchObj.filters = dFilters;
			return transactionSearchObj;
		} catch (error) {
			log.debug("getInputData_"+error.name,error.message);
		}		
	}	
	function map(context) {  
		try {		
			var scriptObj = runtime.getCurrentScript();			
			var obj = JSON.parse(context.value);
			//log.debug("obj",obj);
			var internalid = obj.values.internalid.value;
			var customerEntityId = obj.values['entityid.customer'];
			var customerAltname = obj.values['altname.customer'];
			var tranid = obj.values.tranid;
			var orig_date = obj.values.trandate;
			var trandate = obj.values.formulatext;
			var createdfromID = obj.values.createdfrom.value;
			var createdfrom = obj.values.createdfrom.text;
			var salesrep = obj.values['salesrep.customer'].text;
			var department = obj.values.department.text;
			var quantity = obj.values.quantity;
			var fxamount = obj.values.fxamount;
			var exchangerate = obj.values.exchangerate;
			var functionalNetTotal = obj.values.amount;
			var functionalVAT = obj.values.taxamount;
			var fxtaxamount = Math.round(((functionalVAT) / (exchangerate)) * 100) / 100;
			var grossamount = parseFloat(fxamount) + fxtaxamount;
			var functionalTotalAmount = parseFloat(functionalNetTotal) + parseFloat(functionalVAT);
			var currency = obj.values.currency.text;
			var lineId = obj.values.line;
			var itemInternalid = obj.values['internalid.item'].value;
			var locationId = obj.values.location.value;
			var customerTerms = obj.values['terms.customer'].text;
			var aor = obj.values['custentity_aorcredit.customer'];
			var insurance = obj.values['custentity_insurancecredit.customer'];
			var creaditLimit = obj.values['custentity_creditlimit.customer'];
			var itemId = obj.values['itemid.item'];
			var itemDescription = obj.values['salesdescription.item'];
			var brand = obj.values['custitem_brand.item'].text;
			var Category1 = obj.values['csegitem_category1.item'].text;
			var Category2 = obj.values['csegitem_category2.item'].text;
			var Category3 = obj.values['csegitem_category3.item'].text;
			var program = obj.values['custitem_program.item'].text;
			var itemClass = obj.values['class.item'].text;
			var itemBu = obj.values['custitem_aic_business_unit.item'].text;
			var itemProductline = obj.values['custitem_plm_product_line.item'];
			var poNumber = obj.values.otherrefnum;
			var location = obj.values.location.text;
			var memo = obj.values.memomain;	
			var type = obj.values.type.text;
			var marketcode = obj.values['cseg_aic_marketcode.customer'].text;
			var ro_customerid = '';
			var region_code = '';
			var incoterm = '';
			var product_marketing_name = obj.values['custitem_aic_product_marketing_name.item'];

          if(type == "Credit Memo"){	//取出 Credit Memo 關連的 Sales order單號
				createdfromID = obj.values['createdfrom.createdFrom'].value;
				createdfrom = obj.values['createdfrom.createdFrom'].text;
			}

			if(createdfromID!=undefined) {
				var salesObj = getSalesorder(createdfromID);	
				ro_customerid = salesObj['ro_customerid'];
				region_code = salesObj['region_code'];
				incoterm = salesObj['incoterm'];
			}

			//取出成本
			var totalCOGS = 0;
			var fulfillmentObj = getFulfillment(internalid,createdfromID,itemInternalid,quantity);
			var do_tranid = fulfillmentObj['tranid'];
			totalCOGS = fulfillmentObj['cogsamount'];
			var shipaddressee = fulfillmentObj['shipaddressee'];
			location = fulfillmentObj['location'];
			
			//判斷Type 來讀取createdfrom 與 COGS
			var _tempObj = {};
			var _tempObjR = {};
			var _rmaObj = {};
			var internalidArray = [];
			if(createdfromID && createdfromID.length >0){
				internalidArray.push(createdfromID);
			}
			
			if(type == "Credit Memo"){
				_rmaObj = creatRMASOTable(internalidArray);
				_tempObjR = createCOGSR(internalidArray);
				//createdfrom =getSO(createdfromID,_rmaObj);
				totalCOGS = searchTable(createdfromID, lineId,_tempObjR);
			}

			if(type == "Cash Sale") {	//Cash Sale 成本
				totalCOGS = getCashSale(internalid);
			}
		
			if(createdfrom != "" && createdfrom != null) {
				//log.debug('createdfrom',createdfrom);
				createdfrom = createdfrom.replace("Sales Order #","");
			}

			context.write({
				key: customerEntityId, 
				value: {
					'customerEntityId' : customerEntityId,
					'customerAltname' : customerAltname,
					'tranid' : tranid,
					'trandate': trandate,
					'shipaddressee':shipaddressee,
					'createdfromID' : createdfromID,
					'createdfrom' : createdfrom,
					'do_tranid' : do_tranid,
					'salesrep' : salesrep,
					'department' : department,
					'quantity' : quantity,
					'functionalNetTotal' : functionalNetTotal,
					'functionalVAT' :functionalVAT,
					'functionalTotalAmount' :functionalTotalAmount,
					'currency' : currency,
					'exchangerate' : exchangerate,
					'fxamount' : fxamount,
					'fxtaxamount' : fxtaxamount,
					'grossamount' : grossamount,
					'customerTerms' : customerTerms,	
					'aor' : aor,
					'insurance' : insurance,
					'creaditLimit' :creaditLimit,
					'itemId' : itemId,	
					'itemDescription' : itemDescription,
					'brand' : brand,
					'Category1' : Category1,
					'Category2' : Category2,
					'Category3' : Category3,
					'program' : program,
					'itemClass' : itemClass,
					'itemBu' : itemBu,
					'poNumber' : poNumber,	
					'location' : location,
					'memo' : memo,
					'totalCOGS' : totalCOGS,
					'orig_date' : orig_date,
					'itemInternalid' : itemInternalid,
					'locationId' : locationId,	
					'lineId' : lineId,
					'type':type,
					'marketcode':marketcode,
					'ro_customerid':ro_customerid,
					'product_marketing_name':product_marketing_name,
					'region_code' : region_code,
					'incoterm' : incoterm,
					'itemProductline' : itemProductline
				}
			});		

		} catch (error) {
			log.debug("map_"+error.name,error.message);
		}   	     
		
	}		
	function summarize(context) {
		try {
			// var _tempObj = {};
			// var _tempObjR = {};
			// var _rmaObj = {};
			// var internalidArray = [];
			// var rmaIds = [];
			// var scriptObj = runtime.getCurrentScript();
			// var invoiceno = scriptObj.getParameter({name: 'custscript_mr_xxor003_invoiceno'});
			// var creditmemono = scriptObj.getParameter({name: 'custscript_mr_xxor003_creditmemono'});
			// context.output.iterator().each(function (key, value){
			// 	var details = JSON.parse(value);
			// 	var soId = details.createdfromID;
			// 	var rmaId = details.createdfromID;
			// 	if (soId && soId.length > 0)
			// 		internalidArray.push(soId);
			// 	if (rmaId && rmaId.length > 0)
			// 		rmaIds.push(rmaId);			
			// 	return true;
			// });
			// log.debug("internalidArray",internalidArray);
			// log.debug("rmaIds",rmaIds);
			// if (creditmemono==null){
			// 	_tempObj = createCOGS(internalidArray);
			// }				
			// if (invoiceno==null){
			// 	_tempObjR = createCOGSR(internalidArray);
			// 	_rmaObj = creatRMASOTable(rmaIds);
			// }

			//var isExcel = scriptObj.getParameter({name: 'custscript_isexcel'});
			runExcel(context);		
		} catch (error) {
			log.debug("summarize_"+error.name,error.message);
		}  	

	}	
	function runExcel(context){
		var scriptObj = runtime.getCurrentScript();
		var invoiceno = scriptObj.getParameter({name: 'custscript_mr_xxor003_invoiceno'});
		var creditmemono = scriptObj.getParameter({name: 'custscript_mr_xxor003_creditmemono'});		
		
		var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
		xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
		xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
		xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
		xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
		xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

		xmlString += '<Worksheet ss:Name="Sheet1">';
		xmlString += '<Table>';
		xmlString += '<Row>' +
		'<Cell><Data ss:Type="String">Region</Data></Cell>' +
		'<Cell><Data ss:Type="String">BU</Data></Cell>' +
		'<Cell><Data ss:Type="String">Customer Code</Data></Cell>' +
		'<Cell><Data ss:Type="String">Customer Name</Data></Cell>' +
		'<Cell><Data ss:Type="String">End customer</Data></Cell>' +
		'<Cell><Data ss:Type="String">Addressee</Data></Cell>' +
		'<Cell><Data ss:Type="String">Invoice/Credit Memo No</Data></Cell>' +
		'<Cell><Data ss:Type="String">Transaction Date</Data></Cell>' +
		'<Cell><Data ss:Type="String">SO No</Data></Cell>' +
		'<Cell><Data ss:Type="String">DO No</Data></Cell>' +
		'<Cell><Data ss:Type="String">Sales Person</Data></Cell>' +
		'<Cell><Data ss:Type="String">Department</Data></Cell>' +
		'<Cell><Data ss:Type="String">Bill Qty</Data></Cell>' +
		'<Cell><Data ss:Type="String">Functional Net total</Data></Cell>' +
		'<Cell><Data ss:Type="String">Functional VAT</Data></Cell>' +
		'<Cell><Data ss:Type="String">Functional Total Amount (w/Tax)</Data></Cell>' +
		'<Cell><Data ss:Type="String">Currency</Data></Cell>' +
		'<Cell><Data ss:Type="String">Exchange Rate</Data></Cell>' +
		'<Cell><Data ss:Type="String">Original Net Total(原幣未稅金額)</Data></Cell>' +
		'<Cell><Data ss:Type="String">OriginalVAT</Data></Cell>' +
		'<Cell><Data ss:Type="String">Original Total Amount (w/Tax)</Data></Cell>' +
		'<Cell><Data ss:Type="String">Total-COGS</Data></Cell>' +
		'<Cell><Data ss:Type="String">Functional Operational Margin</Data></Cell>' +
		'<Cell><Data ss:Type="String">Operational Margin %</Data></Cell>' +
		'<Cell><Data ss:Type="String">Term</Data></Cell>' +
		'<Cell><Data ss:Type="String">AOR</Data></Cell>' +
		'<Cell><Data ss:Type="String">保險額度</Data></Cell>' +
		'<Cell><Data ss:Type="String">Credit Limit總額</Data></Cell>' +
		'<Cell><Data ss:Type="String">Model</Data></Cell>' +
		'<Cell><Data ss:Type="String">Part Number</Data></Cell>' +
		'<Cell><Data ss:Type="String">Part Description</Data></Cell>' +
		'<Cell><Data ss:Type="String">品牌</Data></Cell>' +
		'<Cell><Data ss:Type="String">Category1</Data></Cell>' +
		'<Cell><Data ss:Type="String">Category2</Data></Cell>' +
		'<Cell><Data ss:Type="String">Category3</Data></Cell>' +
		'<Cell><Data ss:Type="String">方案</Data></Cell>' +
		'<Cell><Data ss:Type="String">FunctionalTotalCOGS</Data></Cell>' +
		'<Cell><Data ss:Type="String">Class</Data></Cell>' +
		'<Cell><Data ss:Type="String">Customer PO Number</Data></Cell>' +
		'<Cell><Data ss:Type="String">WH Code</Data></Cell>' +
		'<Cell><Data ss:Type="String">Memo</Data></Cell>' +		
		'<Cell><Data ss:Type="String">G_REGION_CODE</Data></Cell>' +		
		'<Cell><Data ss:Type="String">G_INCOTERM</Data></Cell>' +
		'<Cell><Data ss:Type="String">G_PRODUCT_LINE</Data></Cell>' +
		'</Row>';
    	context.output.iterator().each(function (key, value){
			var details = JSON.parse(value);
			if (creditmemono==null && details.type !="Invoice"){
				xmlString = writeXml(key, details, xmlString);
			}				
			if (invoiceno==null && details.type =="Invoice"){
				xmlString = writeXml(key, details, xmlString);
			}				
            return true;
        });
		
		xmlString += '</Table></Worksheet></Workbook>';
    	//encode contents

		
    	var base64EncodedString = encode.convert({
            string: xmlString,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
    	
    	
		//create file
		var folderId = custfolder.getUserFolder(runtime.getCurrentUser().name,'客製報表');
    	var xlsFile = file.create({name: 'Sales Analysis Report.xls', fileType: 'EXCEL', contents: base64EncodedString, folder: folderId});
		xlsFile.save();

	}
	function writeXml(header, detail, xmlString){
		var functionalOperationalMargin = detail.functionalNetTotal - detail.totalCOGS;
		var operationalMarginPercent = ((functionalOperationalMargin / detail.functionalNetTotal) * 100).toFixed(2);
		var FunctionalTotalCOGS = ((detail.totalCOGS)/(detail.quantity));
		//log.debug('itemInternalid:' + detail.itemInternalid + ' locationId:' + detail.locationId + ' orig_date:' + detail.orig_date + ' totalCOGS', totalCOGS);
		
		xmlString += '<Row>' +
		'<Cell><Data ss:Type="String">' + (detail.marketcode || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.itemBu || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.customerEntityId || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.customerAltname || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.ro_customerid || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.shipaddressee || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.tranid || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.trandate || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.createdfrom || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.do_tranid || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.salesrep || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.department || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.quantity + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.functionalNetTotal + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.functionalVAT + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.functionalTotalAmount + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.currency || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.exchangerate || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.fxamount + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.fxtaxamount + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.grossamount + '</Data></Cell>' +
		
		//'<Cell><Data ss:Type="Number"></Data></Cell>' +
		//'<Cell><Data ss:Type="Number"></Data></Cell>' +
		//'<Cell><Data ss:Type="String"></Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + detail.totalCOGS + '</Data></Cell>' +
		'<Cell><Data ss:Type="Number">' + functionalOperationalMargin + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (operationalMarginPercent || '') + '%</Data></Cell>' +

		'<Cell><Data ss:Type="String">' + (detail.customerTerms || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.aor || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.insurance || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.creaditLimit || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.product_marketing_name || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.itemId || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.itemDescription || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.brand || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.Category1 || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.Category2 || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.Category3 || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.program || '') + '</Data></Cell>' +

		'<Cell><Data ss:Type="Number"></Data></Cell>' +
		//'<Cell><Data ss:Type="Number">' + FunctionalTotalCOGS + '</Data></Cell>' +

		'<Cell><Data ss:Type="String">' + (detail.itemClass || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.poNumber || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.location || '') + '</Data></Cell>' +
		'<Cell><Data ss:Type="String">' + (detail.memo || '') + '</Data></Cell>' +	
		'<Cell><Data ss:Type="String">' + (detail.region_code || '') + '</Data></Cell>' +	
		'<Cell><Data ss:Type="String">' + (detail.incoterm || '') + '</Data></Cell>' +	
		'<Cell><Data ss:Type="String">' + (detail.itemProductline || '') + '</Data></Cell>' +
		'</Row>';
    return xmlString;
	}	
	function addFilter(fid,joinfid, oper, val) {
		if(joinfid!=""){
			return search.createFilter({
				name: fid,
				join:joinfid,
				operator: oper,
				values: [val]
			});
		}else{
			return search.createFilter({
				name: fid,
				operator: oper,
				values: [val]
			});
		}		
	}
	function createCOGS(soIds) {
		var _tempObj = {};
		if (soIds.length > 0) {
			var filters = [
				['mainline', 'is', 'F'],
				'and', ['internalid', 'anyof', soIds],
				'and', ['taxline', 'is', false],
				'and', ['cogs', 'is', false],
				'and', ['shipping', 'is', false]
			];
			var searchObj = search.create({
				type: search.Type.SALES_ORDER,
				columns: ['internalid',
						  'fulfillingtransaction.cogsamount',
						  'billingtransaction.line'],
				filters: filters
			});			
			searchObj.run().each(function (result) {				
				var internalid = result.getValue({
					name: 'internalid'
				});
				var line = result.getValue({
					name: 'line',
					join: 'billingtransaction'
				});
				var cogsamount = result.getValue({
					name: 'cogsamount',
					join: 'fulfillingtransaction'
				});
				_tempObj[internalid + '|' + line] = cogsamount;
				return true;
			});		
			return _tempObj;
		}
	}
	function createCOGSR(rmaIds) {
		var _tempObjR = {};
		if (rmaIds.length > 0) {
			var filters = [
				['mainline', 'is', 'F'],
				'and', ['internalid', 'anyof', rmaIds],
				'and', ['taxline', 'is', false],
				'and', ['cogs', 'is', false],
				'and', ['shipping', 'is', false]
			];
			var searchObj = search.create({
				type: search.Type.RETURN_AUTHORIZATION,
				columns: ['internalid',
						  'fulfillingtransaction.cogsamount',
						  'billingtransaction.line'],
				filters: filters
			});			
			searchObj.run().each(function (result) {				
				var internalid = result.getValue({
					name: 'internalid'
				});
				var line = result.getValue({
					name: 'line',
					join: 'billingtransaction'
				});
				var cogsamount = result.getValue({
					name: 'cogsamount',
					join: 'fulfillingtransaction'
				});
				_tempObjR[internalid + '|' + line] = cogsamount;
				return true;
			});	
			return _tempObjR;
		}
	}
	function creatRMASOTable(rmaIds) {
		var _rmaObj = {};
		if (rmaIds.length > 0) {
			var searchObj = search.create({
					type: search.Type.RETURN_AUTHORIZATION,
					columns: ['internalid',
						'createdfrom.createdfrom'],
					filters: [['mainline', 'is', 'T'],
						'and', ['internalid', 'anyof', rmaIds]]
				});
			searchObj.run().each(function (result) {
				var internalid = result.getValue({
						name: 'internalid'
					});
				var createdfrom = result.getText({
						name: 'createdfrom',
						join: 'createdfrom'
					});
				_rmaObj[internalid] = createdfrom;
				return true;
			});
		}
		return _rmaObj;
	}
	function getSO(rmaId,_rmaObj) {
		if (rmaId && rmaId.length > 0) {
			var so = _rmaObj[rmaId];
			if (so)
				return so;
		}
		return '';
	}
	function searchTable(internalId, lineId,_tempObjR) {
		if (!internalId || internalId.length <= 0)
			return 0;
		var key = internalId + '|' + lineId;
		var cogsamount = _tempObjR[key];
		if (!cogsamount)
			cogsamount = 0;
		return cogsamount;
	}

	function getSalesorder(soIds) {
		var sourceObj;		
		var ro_customerid='';
		var region_code = '';
		var incoterm = '';
		
		if (soIds.length > 0) {
			var filters = [
				['mainline', 'is', 'T'],
				'and', ['internalid', 'anyof', soIds]
			];
			var searchObj = search.create({
				type: search.Type.SALES_ORDER,
				columns: [
					search.createColumn({name: "internalid", label: "ID"}),
					search.createColumn({name: "custbody_aic_edi_ro_customerid", label: "G_RO Customer ID"}),
					search.createColumn({name: "custbody_aic_edi_region_code", label: "G_REGION_CODE"}),
					search.createColumn({name: "custbody_aic_s_incoterm", label: "G_INCOTERM"})
				],
				filters: filters
			});			
			searchObj.run().each(function (result) {				
				var internalid = result.getValue({name: 'internalid'});
				ro_customerid = result.getValue({name: 'custbody_aic_edi_ro_customerid'});
				region_code = result.getValue({name: 'custbody_aic_edi_region_code'});
				incoterm = result.getText({name: 'custbody_aic_s_incoterm'});
				return true;
			});		

			sourceObj = {
				ro_customerid : ro_customerid,
				region_code : region_code,
				incoterm : incoterm
			}

			return sourceObj;			
		}
	}

	function getFulfillment(invorcre,createdfrom,itemid,quantity) {
		//log.debug('getFulfillment','createdfrom='+createdfrom+ ' itemid='+ itemid + ' quantity='+quantity);
		try {	
			var tranid = "";
			var cogsamount = 0;
			var shipaddressee = "";
			var location = "";
			var account = "";
			var fulfillmentObj;

			if(createdfrom != "" && createdfrom != null) {
				var searchObj = search.create({
					type: "itemfulfillment",
					filters:
					[
						//["custbody_aic_invoice_number","is",invorcre],
						["createdfrom","anyof",createdfrom],
						//"AND", ["mainline","is","F"],
						//"AND", ["account","anyof","237"],
						//"AND", ["cogs","is","T"],
						"AND", ["item.internalid","is",itemid],
						"AND", ["quantity","equalto",quantity]
					],
					columns:
					[
						//search.createColumn({name: "cogsamount", label: "COGS Amount"})
						search.createColumn({name: "tranid", label: "Document Number"}),
						search.createColumn({name: "formulacurrency", formula: "ABS({cogsamount})", label: "COGS Amount"}),
						search.createColumn({name: "shipaddressee", label: "Shipping Addressee"}),
						search.createColumn({name: "location", label: "Location"}),
						search.createColumn({name: "account", label: "account"}),
					]
				});
	
				searchObj.run().each(function (result) {
					//log.debug('getFulfillment searchObj',result);
					if(account != "237") {
						tranid = result.getValue({name: "tranid"});
						cogsamount = result.getValue({name: "formulacurrency"});
						shipaddressee = result.getValue({name: "shipaddressee"});
						location = result.getText({name: "location"});
						account = result.getValue({name: "account"});
					}
					return true;    
				});
			}
						
      fulfillmentObj = {
				tranid : tranid,
				cogsamount : cogsamount,
				shipaddressee : shipaddressee,
				location : location
			}			

			return fulfillmentObj;
  	} catch (error) {
      log.error("getFulfillment_"+error.name,error.message);
    } 			
	}

	function getCashSale(internalid) {
		try {	
			var cogsamount = 0;
			
			var searchObj = search.create({
				type: "cashsale",
				filters:
				[
					["internalid","anyof",internalid],
					//"AND", ["mainline","is","F"],
					"AND", ["account","anyof","237"],
					"AND", ["cogs","is","T"]
				],
				columns:
				[
					search.createColumn({name: "formulacurrency", formula: "ABS({cogsamount})", label: "COGS Amount"}),
				]
			});

      searchObj.run().each(function (result) {
				//log.debug('getCashSale searchObj',result);
				cogsamount = result.getValue({name: "formulacurrency"});
        return true;    
			});	

			return cogsamount;
  	} catch (error) {
      log.error("getCashSale_"+error.name,error.message);
    } 			
	}	

  return {
    getInputData: getInputData,
		map: map,
		//reduce: reduce,
		summarize: summarize
  };
    
});
