/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(['N/ui/serverWidget','N/record','N/search','N/url','N/redirect','N/ui/message','N/file', './commonAPI/commonUtil'],
    function(serverWidget,record,search,url,redirect,message,file,util)
	{
		
        function onRequest(context)
		{
			var req = context.request;
			
			if (req.method === 'GET')
			{
				
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
                context.response.writePage(form);
				//-----------------------------------

				
				
            } else { // after press button      
				
				//接前頁參數
				//一般媒體申報_條件內容
				var rgd01  = req.parameters.custpage_gd01;  //稅籍編號
				var rgd02  = req.parameters.custpage_gd02;  //申報範圍:1進項,2銷項,3進銷項
				var rgd03  = req.parameters.custpage_gd03;  //申報年度
				var rgd04  = req.parameters.custpage_gd04;  //申報月份_起
				var rgd05  = req.parameters.custpage_gd05;  //申報月份_迄
               
				//字串空白或補0處理 /總長度,字串長度,傳入字串,補字元
				function txtStringPrcess(thisLength,strLength,thisStr,addtype){
					var addStr = '';
					for (var j=strLength; j<thisLength; j++) {
							addStr = addStr + addtype;
					}
					thisStr = addStr + thisStr; //補字元於左處
					return thisStr;
				} 
				//--------------------------------------------------
				
				// 依據所選的稅籍編號抓取對應的統一編號
				var ss2 = search.create({
				   type: "customrecord_ev_registrations_all",
				   filters:[["name", "is", rgd01]], 
				   columns:[
					  search.createColumn({name: "custrecord_18_site_uniform_number", label: "統一編號"}) 
				   ]
				});	
				
				ss2.run().each(function(result){
					defUniNo = result.getValue({ name: "custrecord_18_site_uniform_number" }); 
					return true;
				});
				
				//---------------------------------------------------
				var InputSelect = '';
				var OutputSelect = '';
				var AllSelect = '';
				//---------------------------------------------------
				var fileTxt = '';        //檔案文字內容
				var regNumber = rgd01;   //稅籍編號
				//----------------------------------
				var format_type = '';     //格式別
				var guiDate = '';         //發票日期 
				var guiYear = '';         //發票年度 (資料所屬年度)
				var guiMonth = '';        //發票月份 (資料所屬月份)
				var buyGUInumber =  '';   //買受人統一編號
				var buyGUInumber2 = ''    //客戶統編
				var selGUInumber = '';    //銷售人統一編號
				var guiNo = '';           //統一編號
				var guiAmount = ''        //銷售金額
				var taxCode = '';         //課稅別
			    var taxAmount = ''        //營業稅額(發票稅額)
				var deductionCode = '';   //抵扣代號
				var emptyChar = '';       //空白字元
				var specTax = '';         //特種稅額稅率(1)
				var note = '';            //彙加註記(1)
				var clearType = '';       //通關方式(1)
				var void_flag = '';       //作廢
				//---------------------------------------------------
			    var seqCount = 0;         //流水號
				var seqNumber = '';
				//---------------------------------------------------				
				
				//SaveSearch + 組檔案 --------------------
				//進項發票 Search_11_Inv / Search_11_InvCnt
				//進項折讓 Search_12_Inv / Search_12_InvCnt
				//銷項發票 Search_21_Inv / Search_21_InvCnt
				//銷項折讓 Search_22_Inv / Search_22_InvCnt
				//銷項發票_36格式 Search_36_Inv / Search_36_InvCnt
				//組字串 ----------------------------------
				//進項發票 Inv11iTxtArr
				  var Inv11iTxtArr = [];
				//進項折讓 Inv12iTxtArr
				  var Inv12iTxtArr = [];
				//銷項發票 Inv21oTxtArr
				  var Inv21oTxtArr = [];
				//銷項折讓 Inv22oTxtArr
				  var Inv22oTxtArr = [];
				//銷項_格式36 Inv36oTxtArr
				  var Inv36oTxtArr = [];
				//銷項_空白發票 InvBlankTxtArr
				var InvBlankTxtArr = [];
				//組字串 ----------------------------------
								
				//資料搜尋條件 -----------------		
				var p_GuiYear = rgd03;  //年度
				var p_GuiM1   = rgd04;  //起月
				var p_GuiM2   = rgd05;  //迄月
				//資料搜尋條件 -----------------
			    var loadScope =  rgd02; //申報範圍:1進項,2銷項,3進銷項	
				
					//↓↓↓ 銷項發票Search --------------------
					if (loadScope==2 || loadScope==3) {
					var Search_21_Inv = search.create({
					   type: "customrecord_ev_rec_invoices_all",
					   filters: [["custrecord_1_registration_number.name","is",rgd01],  //稅籍編號 
								  //"AND", ["custrecord_1_gui_book_id.custrecord_19_gui_year","equalto",rgd03], //rgd03
								  "AND", ["custrecord_1_gui_confirmed","is","T"], 
								  "AND", ["formulanumeric: TO_CHAR({custrecord_1_gui_date},'YYYY')","equalto",p_GuiYear],//發票日期取年度
								  "AND", ["formulanumeric: TO_NUMBER(TO_CHAR({custrecord_1_gui_date},'MM'))","greaterthanorequalto",p_GuiM1],//發票日期取月份 
								  "AND", ["formulanumeric: TO_NUMBER(TO_CHAR({custrecord_1_gui_date},'MM'))","lessthanorequalto",p_GuiM2]
								  //"AND", ["custrecord_1_void_flag","is","F"] 作廢的資料也要抓
							    ],
					   columns: [
						  search.createColumn({name: "internalid", label: "Internal ID" }),
						  search.createColumn({name: "custrecord_19_gui_year", join: "CUSTRECORD_1_GUI_BOOK_ID", label: "年度" }),
						  search.createColumn({name: "custrecord_19_gui_start_month", join: "CUSTRECORD_1_GUI_BOOK_ID", label: "起月" }),
						  search.createColumn({name: "custrecord_19_gui_end_month", join: "CUSTRECORD_1_GUI_BOOK_ID", label: "迄月" }),
						  //-----
						  search.createColumn({name: "name", label: "Name"}),						  
						  search.createColumn({name: "custrecord_1_format_type", sort: search.Sort.ASC, label: "格式別"}),
						  search.createColumn({name: "custrecord_1_void_flag", sort: search.Sort.ASC, label: "作廢"}),						  
						  search.createColumn({name: "custrecord_1_gui_no", sort: search.Sort.ASC, label: "發票號碼"}),
						  search.createColumn({name: "custrecord_1_einv_type", label: "電子發票格式"}), //2019.10.28
						  search.createColumn({name: "custrecord_1_gui_date", label: "發票日期"}),
						  search.createColumn({name: "custrecord_1_buyer_no", label: "買受人統一編號"}),
						  search.createColumn({name: "custrecord_1_sales_no", label: "客戶統編"}),
						  search.createColumn({name: "custrecord_1_tax_code", label: "課稅別"}),
                  search.createColumn({name: "custrecord_1_gui_type", label: "聯式"}),                //2022.06.29 add column
						  search.createColumn({name: "custrecord_1_sales_total_amt", label: "發票含稅總額"}),
						  search.createColumn({name: "custrecord_1_sales_amt", label: "發票未稅金額"}),
						  search.createColumn({name: "custrecord_1_vat_io", label: "發票稅額"}),
						  search.createColumn({name: "custrecord_1_gv_z_doc_flag", label: "零稅率通關註記"}), //2019.11.06 零稅率通關註記
						  search.createColumn({name: "custrecord_18_site_name_chinese",join: "CUSTRECORD_1_REGISTRATION_NUMBER",label: "公司登記名稱(中文)"}),
						  search.createColumn({name: "custrecord_18_site_uniform_number", join: "CUSTRECORD_1_REGISTRATION_NUMBER", label: "統一編號"}),
						  search.createColumn({name: "custrecord_1_registration_number", label: "稅籍編號"}),
						  search.createColumn({name: "custrecord_1_gui_confirmed", label: "GUI_CONFIRMED"}),
						  search.createColumn({name: "formulatext1",formula: "TO_CHAR({custrecord_1_gui_date},'YYYY')-1911",label: "發票日期年度"}),
						  search.createColumn({name: "formulatext2",formula: "TO_CHAR({custrecord_1_gui_date},'MM')",label: "發票日期月份"})
					   ]
					});
						var Search_21_InvCnt = Search_21_Inv.runPaged().count;
						//↓↓↓ 銷項發票資料內容
						Search_21_Inv.run().each(function(result){// .run().each has a limit of 4,000 results					    
							//--------------------
							format_type = result.getText({name: "custrecord_1_format_type"}); //格式別
								format_type = format_type.substring(0,2);							
						    var guiDateY = result.getValue({name: "formulatext1"}); //發票日期:年度/月份
							var guiDateM = result.getValue({name: "formulatext2"}); //發票日期:年度/月份
							buyGUInumber = result.getValue({name: "custrecord_1_buyer_no"}); //買受人統一編號
							buyGUInumber2 = result.getValue({name: "custrecord_1_sales_no"}); //客戶統編
							if (buyGUInumber=='') {buyGUInumber = buyGUInumber2;}
								buyGUInumber = txtStringPrcess(8,buyGUInumber.length,buyGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							selGUInumber = result.getValue({name: "custrecord_18_site_uniform_number", join: "CUSTRECORD_1_REGISTRATION_NUMBER"}); //銷售人統一編號
								selGUInumber = txtStringPrcess(8,selGUInumber.length,selGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							guiNo = result.getValue({name: "custrecord_1_gui_no"}); //統一發票號碼
								guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
							guiAmount = result.getValue({name: "custrecord_1_sales_amt"}); //銷售金額(未含稅) 
								guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
							taxCode = result.getValue({name: "custrecord_1_tax_code"}); //課稅別
								taxCode = txtStringPrcess(1,taxCode.length,taxCode,'0');//總長度,字串長度,傳入字串,補字元
							taxAmount = result.getValue({name: "custrecord_1_vat_io"}); //營業稅額(發票稅額)
								taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
							deductionCode = '';  //抵扣代號_銷項為空白
								deductionCode = txtStringPrcess(1,deductionCode.length,deductionCode,' ');//總長度,字串長度,傳入字串,補字元
							emptyChar = ''; //空白
								emptyChar = txtStringPrcess(5,emptyChar.length,emptyChar,' ');//總長度,字串長度,傳入字串,補字元
							specTax = ''; //特種稅額稅率(1)_空白
								specTax = txtStringPrcess(1,specTax.length,specTax,' ');//總長度,字串長度,傳入字串,補字元
							note = ''; //彙加註記(1)_空白
								note = txtStringPrcess(1,note.length,note,' ');//總長度,字串長度,傳入字串,補字元
							clearType = ''; //通關方式(1)_空白
							clearType = result.getText({name: "custrecord_1_gv_z_doc_flag"}); //零稅率通關註記 2019.11.06
							clearType = clearType.substring(0,1);						
								clearType = txtStringPrcess(1,clearType.length,clearType,' ');//總長度,字串長度,傳入字串,補字元
							void_flag = result.getValue({name: "custrecord_1_void_flag"}); //作廢
							//------------------------------
							var einv_type = result.getText({ name: "custrecord_1_einv_type" });  //電子發票格式 2019.10.28	
								einv_type = einv_type.substring(0,5);
							//-------------------------------   2022.06.29 發票聯式
							var gui_type = result.getValue({ name:"custrecord_1_gui_type"}); // 發票聯 2022.06.29 add
                          
							//2019.10.28 電子發票上傳為 B2C 不印發票抬頭和統編 , 2019.11.06 稅額=0 -- 2022.06.28 加入稅額判斷
							if ((einv_type == 'C0401') && (gui_type == '2')) {
								buyGUInumber = '';
								buyGUInumber = txtStringPrcess(8,buyGUInumber.length,buyGUInumber,' ');//總長度,字串長度,傳入字串,補字元
								taxAmount = '';
								taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
                      //-- 2022.06.28 加入稅額判斷
								guiAmount = result.getValue({name: "custrecord_1_sales_total_amt"}); //發票含稅總額
								guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
							}
														
							//32格式資料處理
							   // if (format_type == '32'){     //2022.06.29 modify
							   if (gui_type == '2'){            //2022.06.29 modify
									guiAmount = result.getValue({name: "custrecord_1_sales_total_amt"}); //發票含稅總額
									guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
									taxAmount = '';
								    taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
								}
							
							//--------------------

							if (void_flag == true) { 
									taxCode = 'F'; //作廢發票課稅別 = F
									guiAmount = '';
									guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//銷售金額 = 0
									taxAmount = '';
									taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//營業稅額 = 0	
                                    //作廢發票時, 買受人統編應為空白
									buyGUInumber = '';
									buyGUInumber = txtStringPrcess(8,buyGUInumber.length,buyGUInumber,' ');//總長度,字串長度,傳入字串,補字元								
								}
								else { void_flag = ''; }
								
							//1.格式別,2.稅籍編號,3.流水號,4.年度,5.月份
							//6.買受人統編,7.銷售人統編,8.統一發票,9.銷售金額,10.課稅別
							//11.營業稅額,12.抵扣代號,13.空白
							//14.特種稅額稅率(1),15.彙加註記(1),16.通關方式(1)
							Inv21oTxtArr.push(new Array(format_type, regNumber, seqNumber, guiDateY, guiDateM
													  , buyGUInumber, selGUInumber, guiNo, guiAmount, taxCode
													  , taxAmount, deductionCode, emptyChar
													  , specTax, note, clearType
													  //, void_flag
													  ));						   
						   return true;
						});
						//↑↑↑ 銷項發票資料內容
						
						
						
						//↓↓↓ 銷項發票_增加格式:36_資料內容
						var Search_36_Inv = search.create({
						   type: "customrecord_ev_zero_tax_all",
						   filters:[  ["custrecord_z_registration_number.name","is",rgd01], 
									  "AND",["custrecord_z_occured_year","equalto",p_GuiYear],  
									  "AND",["custrecord_z_occured_month","greaterthanorequalto",p_GuiM1], 
									  "AND",["custrecord_z_occured_month","lessthanorequalto",p_GuiM2]
								   ],
						   columns:[
							  search.createColumn({name: "internalid", label: "Internal ID"}),
							  //search.createColumn({name: "custrecord_z_registration_number", label: "稅籍編號"}),
							  search.createColumn({name: "custrecord_z_export_way", label: "適用零稅率規定"}),
							  search.createColumn({name: "custrecord_z_doc_flag", label: "通關方式"}),
							  search.createColumn({name: "custrecord_z_doc_type", label: "報單類別"}),
							  search.createColumn({name: "custrecord_z_customs_no", label: "報關單號"}),
							  search.createColumn({name: "custrecord_z_doc_amount", label: "申報文件金額"}),
							  search.createColumn({name: "custrecord_z_amount_ntd", label: "申報台幣金額"}),
							  search.createColumn({name: "custrecord_z_sales_no", label: "買受人統編"}), //custrecord_sales_no>custrecord_z_sales_no
							  search.createColumn({name: "custrecord_z_occured_year", label: "所屬年"}),
							  search.createColumn({name: "custrecord_z_occured_month", label: "所屬月"}),
							  search.createColumn({name: "custrecord_z_exemption_flag", label: "免開統一發票"}),
							  search.createColumn({name: "custrecord_z_exemption_no", label: "免開統一發票流水碼"}) //custrecord_exemption_no > custrecord_z_exemption_no
						   ]
						});
						var Search_36_InvCnt = Search_36_Inv.runPaged().count;
						if (Search_36_InvCnt > 0) { //零稅率筆數>0時
							Search_36_Inv.run().each(function(result){
							var exportWay = result.getText({name: "custrecord_z_export_way"}); //適用零稅率規定
										exportWay = exportWay.substr(0,1);
							var docFlag   = result.getText({name: "custrecord_z_doc_flag"}); //通關方式
							docFlag = docFlag.substr(0,1);
						    var tax0year  = result.getValue({name: "custrecord_z_occured_year"}); //所屬年
							    tax0year = tax0year - 1911;
							var tax0month = result.getValue({name: "custrecord_z_occured_month"}); //所屬月
							    if (tax0month.length==1) {tax0month='0'+tax0month;}
							var buyer0No  = result.getValue({name: "custrecord_z_sales_no"}); //買受人統編  custrecord_sales_no>custrecord_z_sales_no
								buyer0No = txtStringPrcess(8,buyer0No.length,buyer0No,' ');//總長度,字串長度,傳入字串,補字元
							var format36   = result.getValue({name: "custrecord_z_exemption_flag"}); //免開統一發票
							var format36No = result.getValue({name: "custrecord_z_exemption_no"}); //免開統一發票流水碼
							    format36No = txtStringPrcess(10,format36No.length,format36No,' ');//總長度,字串長度,傳入字串,補字元
							var guiAmount = result.getValue({name: "custrecord_z_amount_ntd"}); //申報台幣金額
								 		if (guiAmount.length < 12) { //補滿12碼
											var ads = 12 - guiAmount.length;
											for (var j=1; j<=ads; j++) {
												guiAmount = '0'+ guiAmount;
											}}
							//log.debug('36','format36:'+format36);	
							if (format36==true){ //2019.11.11 免開統一發票 有勾選的才需要申報
							//1.格式別,2.稅籍編號,3.流水號,4.年度,5.月份
							//6.買受人統編,7.銷售人統編,8.統一發票,9.銷售金額,10.課稅別
							//11.營業稅額,12.抵扣代號,13.空白
							//14.特種稅額稅率(1),15.彙加註記(1),16.通關方式(1)
							Inv36oTxtArr.push(new Array('36', regNumber, seqNumber, tax0year, tax0month
													  , buyer0No, selGUInumber, format36No, guiAmount, '2'
													  , '0000000000', ' ', '     '
													  , ' ', ' ', docFlag
													  //, void_flag
													  ));
							}
							   return true;
							});
						}
						
						//↑↑↑ 銷項發票_增加格式:36_資料內容	
						

						//↓↓↓ 銷項發票_空白發票 2019.11.06 Search_blank_Inv Search_blank_InvCnt
						var Search_blank_Inv = search.create({
							type: "customrecord_ev_blank_invoice_all",
							filters:[["custrecord_registration_number.name","is", rgd01], 
							 "AND",  ["custrecord_gui_year","equalto",p_GuiYear], 
							 "AND",  ["custrecord_gui_start_month","greaterthanorequalto",p_GuiM1], 
							 "AND",  ["custrecord_gui_end_month","lessthanorequalto",p_GuiM2]	],
							columns:[
							   search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name"}),
							   search.createColumn({name: "custrecord_registration_number", label: "稅籍編號"}),
							   search.createColumn({name: "custrecord_gui_year", label: "所屬年度"}),
							   search.createColumn({name: "custrecord_gui_occured_month", label: "所屬月份"}),
							   search.createColumn({name: "custrecord_gui_start_month", label: "起始月份"}),
							   search.createColumn({name: "custrecord_gui_end_month", label: "截止月份"}),
							   search.createColumn({name: "custrecord_gui_word", label: "字軌"}),
							   search.createColumn({name: "custrecord_gui_start_number", label: "起始號碼"}),
							   search.createColumn({name: "custrecord_gui_end_number", label: "截止號碼"}),
							   search.createColumn({name: "custrecord_gui_book_name", label: "發票簿名稱"}),
							   search.createColumn({name: "custrecord_summary_note", label: "彙加註記"}),
							   search.createColumn({name: "custrecord_gui_format_type", label: "格式別"})
							]
						 });
						 var Search_blank_InvCnt = Search_blank_Inv.runPaged().count; 
						 Search_blank_Inv.run().each(function(result){// .run().each has a limit of 4,000 results
							var blankYear  = result.getValue({name: "custrecord_gui_year"}); //所屬年
							    blankYear = blankYear - 1911;
							var blankMonth = result.getValue({name: "custrecord_gui_occured_month"}); //所屬月
							    if (blankMonth.length==1) {blankMonth='0'+blankMonth;}
							var summaryNote = result.getValue({name: "custrecord_summary_note"}); //彙加註記
								summaryNote = txtStringPrcess(1,summaryNote.length,summaryNote,' ');//總長度,字串長度,傳入字串,補字元
							var blankWord = result.getText({name: "custrecord_gui_word"}); //字軌
							var blankStartNo = result.getValue({name: "custrecord_gui_start_number"}); //起始號碼
							var blankEndNo   = result.getValue({name: "custrecord_gui_end_number"});   //截止號碼
							var blankFormat  = result.getValue({name: "custrecord_gui_format_type"});   //格式別
							var blankFormat2 = result.getText({name: "custrecord_gui_format_type"});   //格式別
							blankFormat = blankFormat2.substring(0,2);
							blankStartNo = blankWord + blankStartNo;
							var blankBuyerNo = '';
								if (summaryNote=='A'){
									blankBuyerNo = blankEndNo;
								}
								blankBuyerNo = txtStringPrcess(8,blankBuyerNo.length,blankBuyerNo,' ');//總長度,字串長度,傳入字串,補字元

							var docFlag = ' ';

							//1.格式別,2.稅籍編號,3.流水號,4.年度,5.月份
							//6.買受人統編,7.銷售人統編,8.統一發票,9.銷售金額,10.課稅別
							//11.營業稅額,12.抵扣代號,13.空白
							//14.特種稅額稅率(1),15.彙加註記(1),16.通關方式(1)
							InvBlankTxtArr.push(new Array(blankFormat, regNumber, seqNumber, blankYear, blankMonth
													  , blankBuyerNo, selGUInumber, blankStartNo, '000000000000', 'D'
													  , '0000000000', ' ', '     '
													  , ' ', summaryNote, docFlag
													  //, void_flag
													  ));
							return true;
						 });
						//↑↑↑ 銷項發票_空白發票 2019.11.06

					}
					

					//↑↑↑ 銷項發票Search --------------------



					//↓↓↓ 銷折發票Search --------------------
					if (loadScope==2 || loadScope==3) {
					var Search_22_Inv = search.create({
					   type: "customrecord_ev_rec_cm_all",
					   filters:[ ["custrecord_3_registration_number.name","is",rgd01], //稅籍編號
						  "AND", ["custrecord_3_occured_year","equalto",p_GuiYear], 
						  "AND", ["custrecord_3_occured_month","greaterthanorequalto",p_GuiM1], 
						  "AND", ["custrecord_3_occured_month","lessthanorequalto",p_GuiM2], 
						  "AND", ["custrecord_3_gui_confirm","is","T"], 
						  "AND", ["custrecord_3_void_flag","is","F"]  ],
					   columns:
					   [  search.createColumn({name: "custrecord_3_registration_number", label: "稅籍編號"}),
						  search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name"}), //銷折編號
						  search.createColumn({name: "custrecord_3_gui_confirm", label: "GUI Confirm"}),
						  search.createColumn({name: "custrecord_3_void_flag", label: "作廢"}),
						  search.createColumn({name: "custrecord_3_occured_year", label: "銷折所屬年"}),
						  search.createColumn({name: "custrecord_3_occured_month", label: "銷折所屬月"}),
						  search.createColumn({name: "custrecord_3_format_type", label: "銷折格式別"}),
						  search.createColumn({name: "custrecord_3_tax_code", label: "銷折課稅別"}),
						  search.createColumn({name: "custrecord_3_customer_name", label: "銷折客戶"}),
						  search.createColumn({name: "custrecord_3_buyer_no", label: "銷折客戶統一編號"}),
						  search.createColumn({name: "custrecord_3_vat_io", label: "銷折折讓稅額"}),
						  search.createColumn({name: "custrecord_3_sales_amt", label: "銷折折讓金額"}),
						  search.createColumn({name: "internalid", label: "Internal ID"}), //2019.11.08
						  search.createColumn({name: "custrecord_18_site_uniform_number", join: "CUSTRECORD_3_REGISTRATION_NUMBER", label: "統一編號"}),
						  search.createColumn({name: "name", join: "CUSTRECORD_3_REGISTRATION_NUMBER", label: "Name"})
					   ]
					});				
						var Search_22_InvCnt = Search_22_Inv.runPaged().count;


						
						var rcm_guino = '';   //銷折單號ID
						var rcm_guiname = ''; //銷折單號
						var mutiGetGuiArr = [];



						//↓↓↓ 銷折發票資料內容
						Search_22_Inv.run().each(function(result){ // .run().each has a limit of 4,000 results
						   //--------------------
							format_type = result.getText({name: "custrecord_3_format_type"}); //銷折格式別
								format_type = format_type.substring(0,2);							
						    var guiDateY = result.getValue({name: "custrecord_3_occured_year"}); //銷折所屬年
							    guiDateY = guiDateY - 1911;
							var guiDateM = result.getValue({name: "custrecord_3_occured_month"}); //銷折所屬月
							    guiDateM = txtStringPrcess(2,guiDateM.length,guiDateM,'0');
							buyGUInumber = result.getValue({name: "custrecord_3_buyer_no"}); //買受人統一編號#
								buyGUInumber = txtStringPrcess(8,buyGUInumber.length,buyGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							selGUInumber = result.getValue({name: "custrecord_18_site_uniform_number", join: "CUSTRECORD_3_REGISTRATION_NUMBER"}); //統一編號(公司)
								selGUInumber = txtStringPrcess(8,selGUInumber.length,selGUInumber,' ');//總長度,字串長度,傳入字串,補字元
								//guiNo = result.getValue({name: "name"}); //銷折編號
								// guiNo = result.getText({name: "custrecord_4_prev_gui_id"}); //*****
									//guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
							guiAmount = result.getValue({name: "custrecord_3_sales_amt"}); //銷折折讓金額 
								guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
							taxCode = result.getValue({name: "custrecord_3_tax_code"}); //銷折課稅別
								taxCode = txtStringPrcess(1,taxCode.length,taxCode,'0');//總長度,字串長度,傳入字串,補字元
							taxAmount = result.getValue({name: "custrecord_3_vat_io"}); //銷折折讓稅額
								taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
							deductionCode = '';  //抵扣代號_銷項為空白
								deductionCode = txtStringPrcess(1,deductionCode.length,deductionCode,' ');//總長度,字串長度,傳入字串,補字元
							emptyChar = ''; //空白
								emptyChar = txtStringPrcess(5,emptyChar.length,emptyChar,' ');//總長度,字串長度,傳入字串,補字元
							specTax = ''; //特種稅額稅率(1)_空白
								specTax = txtStringPrcess(1,specTax.length,specTax,' ');//總長度,字串長度,傳入字串,補字元
							note = ''; //彙加註記(1)_空白
								note = txtStringPrcess(1,note.length,note,' ');//總長度,字串長度,傳入字串,補字元
							clearType = ''; //通關方式(1)_空白
								clearType = txtStringPrcess(1,clearType.length,clearType,' ');//總長度,字串長度,傳入字串,補字元
							//銷折沒有做作廢
							rcm_guino = '';
							rcm_guino = result.getValue({name: "internalid"}); //銷項折讓ID
							rcm_guiname = result.getValue({name: "name"});
							//rcm_guino = result.getValue({name: "name"}); //銷項折讓,銷折編號
							//--------------------
							//log.debug('銷折','* 銷項折讓(表頭)_ID_rcm_guino:' + rcm_guino + ', ' + rcm_guiname);
							


							//↓ 銷項折讓明細資料
							var isMutiGUI = 'N';  //是否多筆折讓明細
							var thisGuiNoID = ''; //銷折明細憑證號碼ID


							var Search_22D_Inv = search.create({
							   type: "customrecord_ev_rec_cm_lines_all",
							   filters:[["custrecord_4_parent_id","anyof",rcm_guino]],
							   columns: [   search.createColumn({name: "custrecord_4_parent_id", label: "PARENT_ID"}),
											search.createColumn({name: "custrecord_4_order_no", label: "明細排列序號"}),
											search.createColumn({name: "custrecord_4_prev_gui_id", sort: search.Sort.ASC, label: "憑證號碼"}),
											search.createColumn({name: "custrecord_4_line_ntd_amount", label: "折讓未稅金額"}),
											search.createColumn({name: "custrecord_4_tax_ntd_amount", label: "折讓稅額"}),								  
							   			]
							});
							var Search_22D_InvCnt = Search_22D_Inv.runPaged().count;    //log.debug('銷折','銷折明細筆數:' + Search_22D_InvCnt);
							

							
							if (Search_22D_InvCnt=='1'){
								//↓ 銷項折讓明細_只有一筆資料
								Search_22D_Inv.run().each(function(result){
									guiNo = result.getText({name: "custrecord_4_prev_gui_id"}); //憑證號碼
										 guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
									thisGuiNoID = result.getValue({name: "custrecord_4_prev_gui_id"});
								    return true;
								});
							}
							else {
								isMutiGUI = 'Y';
								//↓ 銷項折讓明細_有多筆資料
								guiNo = '';  //折讓明細中的憑證號碼
									guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
								/* 2020.05.13
									1.檢查是否有多張發票
									2.多張發票時.Group by 憑證號碼, 加總, 分別顯示							
								*/								
								Search_22D_Inv.run().each(function(result){
									var guiNoMuti = result.getText({name: "custrecord_4_prev_gui_id"}); //憑證號碼
									var guiMutiAmt = result.getValue({name: "custrecord_4_line_ntd_amount"}); //折讓未稅金額
									var guiMutiTax = result.getValue({name: "custrecord_4_tax_ntd_amount"}); //折讓稅額
									thisGuiNoID = result.getValue({name: "custrecord_4_prev_gui_id"});
									//log.debug('銷折','(多筆)憑證號碼:' + guiNoMuti + ', 未稅:' + guiMutiAmt + ', 稅:' + guiMutiTax);
									//將折讓明細先放入陣列
									mutiGetGuiArr.push(new Array( thisGuiNoID  //0.憑證號碼ID
																, guiNoMuti    //1.憑證號碼
																, guiMutiAmt   //2.折讓未稅金額
																, guiMutiTax   //3.折讓稅額
																, rcm_guiname  //4.折讓單號
																));
								    return true;
								});
									// log.debug('GVD','mutiGetGuiArr:' + mutiGetGuiArr.length);
									// for (var k=0; k<mutiGetGuiArr.length; k++) {
									// 	log.debug('CKCK',k + '_折讓單號:' + mutiGetGuiArr[k][4] + '_憑證號碼ID:' + mutiGetGuiArr[k][0] + '_憑證號碼:' + mutiGetGuiArr[k][1] + '_折讓未稅金額:' + mutiGetGuiArr[k][2] + '_折讓稅額:' + mutiGetGuiArr[k][3]);
									// }



									var ckRCMguiNo = ''; //折讓單號
									var mutiGetNo = [];
									for (var k=0; k<mutiGetGuiArr.length; k++) {
										if (ckRCMguiNo != mutiGetGuiArr[k][4]){
											//log.debug('CKCK',k + '*_折讓單號:' + mutiGetGuiArr[k][4] + '_憑證號碼ID:' + mutiGetGuiArr[k][0]);
											ckRCMguiNo = mutiGetGuiArr[k][4];
											mutiGetNo.push(new Array( ckRCMguiNo  //折讓單號
												));
										}										
									}

									// for (var k=0; k<mutiGetNo.length; k++) {
									// 	log.debug('CKCK',k + '_折讓單號:' + mutiGetNo[k][0]);
									// }									

									
									var ckthisGuiNo = '';
									var ckthisseq = -1;
									var ckthisAmt = 0;
									var ckthisTax = 0;
									var ckGuiArr = [];
									for (var i=0; i<mutiGetNo.length; i++) {
										for (var j=0; j<mutiGetGuiArr.length; j++) {
											if (mutiGetNo[i][0] == mutiGetGuiArr[j][4]){
												if (ckthisGuiNo != mutiGetGuiArr[j][1]) {
													ckthisseq = ckthisseq + 1
													ckGuiArr.push(new Array(  mutiGetGuiArr[j][0]
																			, mutiGetGuiArr[j][1]
																			, mutiGetGuiArr[j][2]
																			, mutiGetGuiArr[j][3]
																			, mutiGetGuiArr[j][4]
																			));
													ckthisGuiNo = mutiGetGuiArr[j][1];
													ckthisAmt = mutiGetGuiArr[j][2];
													ckthisTax = mutiGetGuiArr[j][3];
												}	else {
													var thisAmt = parseInt(mutiGetGuiArr[j][2]);
													ckthisAmt = parseInt(ckthisAmt) + parseInt(thisAmt);
													var thisTax = parseInt(mutiGetGuiArr[j][3]);
													ckthisTax = parseInt(ckthisTax) + parseInt(thisTax);
													ckGuiArr[ckthisseq][2] = ckthisAmt;
													ckGuiArr[ckthisseq][3] = ckthisTax;
												}	
											}																		
										}
									}
									
									//Group by 後的資料陣列
									// for (var k=0; k<ckGuiArr.length; k++) {
									// 	log.debug('CKCK',k + '***_折讓單號:'+ ckGuiArr[k][4] +'_憑證號碼ID:' + ckGuiArr[k][0] + '_憑證號碼:' + ckGuiArr[k][1] + '_折讓未稅金額:' + ckGuiArr[k][2] + '_折讓稅額:' + ckGuiArr[k][3]);
									// }
							}//↑ 銷項折讓明細_有多筆資料							
								


							//--------------------
							if (isMutiGUI == 'N') {//銷折明細僅一筆時
								Inv22oTxtArr.push(new Array(format_type, regNumber, seqNumber, guiDateY, guiDateM
									, buyGUInumber, selGUInumber, guiNo, guiAmount, taxCode
									, taxAmount, deductionCode, emptyChar
									, specTax, note, clearType
									));
							}
							if (isMutiGUI == 'Y') {//銷折明細有多筆時, 依憑證號碼不同分別列出
								for (var k=0; k<ckGuiArr.length; k++) {
									guiNo = ckGuiArr[k][1];
										guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
									var showAmt = ckGuiArr[k][2];
									guiAmount = showAmt.toString();
										guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
									var showTax = ckGuiArr[k][3];
									taxAmount = showTax.toString();
										taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元

										//寫入陣列
										if (ckGuiArr[k][4] == rcm_guiname) {
											Inv22oTxtArr.push(new Array(format_type, regNumber, seqNumber, guiDateY, guiDateM
												, buyGUInumber, selGUInumber, guiNo, guiAmount, taxCode
												, taxAmount, deductionCode, emptyChar
												, specTax, note, clearType
												));
										}
									
								}								
							}
	  						//--------------------			

							//log.debug('銷折',isMutiGUI + ' ,格式別:' + format_type + ', GUINO:' + guiNo + ', guiAmount:' + guiAmount);

						   return true;
						});
						//↑↑↑ 銷折發票資料內容
					}
					//↑↑↑ 銷折發票Search --------------------
					

					
					//↓↓↓ 進項發票Search --------------------
					if (loadScope==1 || loadScope==3) {
					var Search_11_Inv = search.create({
					   type: "customrecord_ev_pay_invoices_all",
					   filters:[ ["custrecord_10_gui_confirmed","is","T"],
						  "AND", ["custrecord_10_registration_number.name","is",rgd01], 
						  "AND", ["custrecord_10_void_flag","is","F"], 
						  "AND", ["custrecord_10_format_type","noneof","5"], 
						  "AND", ["custrecord_10_occured_year","equalto",p_GuiYear], 
						  "AND", ["custrecord_10_occured_month","greaterthanorequalto",p_GuiM1], 
						  "AND", ["custrecord_10_occured_month","lessthanorequalto",p_GuiM2] 
					   ],
					   columns:
					   [
						  search.createColumn({name: "custrecord_10_format_type", sort: search.Sort.ASC, label: "憑證格式別"}),	//進項格式別
						  search.createColumn({name: "custrecord_10_occured_year",sort: search.Sort.ASC,label: "所屬年"}),
                          search.createColumn({name: "custrecord_10_occured_month",sort: search.Sort.ASC,label: "所屬月"}),
						  search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name"}), //進項發票號碼 
						  search.createColumn({name: "custrecord_10_sales_no", label: "廠商統一編號"}),
						  search.createColumn({name: "custrecord_vendor_tax_code", label: "廠商稅碼"}),
						  search.createColumn({name: "formulatext", formula: "TO_CHAR({custrecord_10_gui_date},'YYYY/MM/DD')", label: "憑證日期"}),
						  search.createColumn({name: "formulatext1", formula: "TO_CHAR({custrecord_10_gui_date},'YYYY')", label: "憑證年份"}), //所屬年份
						  search.createColumn({name: "formulatext2", formula: "TO_CHAR({custrecord_10_gui_date},'MM')", label: "憑證月份"}), //所屬月份
						  search.createColumn({name: "custrecord_10_gui_no", label: "發票號碼"}),
						  search.createColumn({name: "custrecord_10_sales_total_amt", label: "憑證含稅總額"}),
						  search.createColumn({name: "custrecord_10_sales_amt", label: "憑證未稅金額"}),
						  search.createColumn({name: "custrecord_10_vat_io", label: "憑證稅額"}),
						  search.createColumn({name: "custrecord_10_customs_sales_amt", label: "營業稅稅基"}),
						  search.createColumn({name: "custrecord_10_tax_code", label: "課稅別"}),
						  search.createColumn({name: "custrecord_10_tax_calc_type", label: "含稅類別"}),
						  search.createColumn({name: "custrecord_10_cut_code", label: "扣抵代號"}),
						  search.createColumn({name: "custrecord_10_other_desc", label: "其他憑證號碼"}), //其他憑證號碼(22&99)
						  search.createColumn({name: "custrecord_10_public_vehicle", label: "公營載具號碼"}), //公營載具號碼(25)
						  search.createColumn({name: "name", join: "CUSTRECORD_10_REGISTRATION_NUMBER", label: "Name"}), //公司稅稽編號
						  search.createColumn({name: "custrecord_10_customs_tax_coll", label: "海關代徵稅單號碼(28)"}),
						  search.createColumn({name: "custrecord_18_site_uniform_number", join: "CUSTRECORD_10_REGISTRATION_NUMBER", label: "統一編號"}) //公司統一編號
					   ]
					});				
						var Search_11_InvCnt = Search_11_Inv.runPaged().count;
						//↓↓↓ 進項發票資料內容
						Search_11_Inv.run().each(function(result){ // .run().each has a limit of 4,000 results
						   //--------------------
							format_type = result.getText({name: "custrecord_10_format_type"}); //進項格式別
								format_type = format_type.substring(0,2);							
						    var guiDateY = result.getValue({name: "formulatext1"}); //所屬年份
							     guiDateY = guiDateY-1911;
							var guiDateM = result.getValue({name: "formulatext2"}); //所屬月份
								guiDateM = txtStringPrcess(2,guiDateM.length,guiDateM,'0')
							buyGUInumber = defUniNo; //買受人統一編號 => 公司統一編號
								buyGUInumber = txtStringPrcess(8,buyGUInumber.length,buyGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							selGUInumber = result.getValue({name: "custrecord_10_sales_no"}); //進貨廠商統一編號
								selGUInumber = txtStringPrcess(8,selGUInumber.length,selGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							guiNo = result.getValue({name: "custrecord_10_gui_no"}); //進項發票號碼 
								guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
							guiAmount = result.getValue({name: "custrecord_10_sales_amt"}); //憑證未稅金額 
								guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
							taxCode = result.getValue({name: "custrecord_10_tax_code"}); //課稅別
								taxCode = txtStringPrcess(1,taxCode.length,taxCode,'0');//總長度,字串長度,傳入字串,補字元
							taxAmount = result.getValue({name: "custrecord_10_vat_io"}); //憑證稅額
								taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
							deductionCode = result.getValue({name: "custrecord_10_cut_code"});  //抵扣代號 
								deductionCode = txtStringPrcess(1,deductionCode.length,deductionCode,' ');//總長度,字串長度,傳入字串,補字元
							emptyChar = ''; //空白
								emptyChar = txtStringPrcess(5,emptyChar.length,emptyChar,' ');//總長度,字串長度,傳入字串,補字元
							specTax = ''; //特種稅額稅率(1)_空白
								specTax = txtStringPrcess(1,specTax.length,specTax,' ');//總長度,字串長度,傳入字串,補字元
							note = ''; //彙加註記(1)_空白
								note = txtStringPrcess(1,note.length,note,' ');//總長度,字串長度,傳入字串,補字元
							clearType = ''; //通關方式(1)_空白
								clearType = txtStringPrcess(1,clearType.length,clearType,' ');//總長度,字串長度,傳入字串,補字元
							var bYear  = result.getValue({name: "custrecord_10_occured_year"});
							var bMonth = result.getValue({name: "custrecord_10_occured_month"});
							
							//進項沒有做作廢
							//格式别28_guiAmount_抓營業稅稅基
							if (format_type == '28'){
								guiAmount = result.getValue({name: "custrecord_10_customs_sales_amt"}); //營業稅稅基 
								  guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
							    selGUInumber = '';
								  selGUInumber = txtStringPrcess(4,selGUInumber.length,selGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							    guiNo = result.getValue({name: "custrecord_10_customs_tax_coll"}); //海關代徵稅單號碼
								  guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
							}
							if (format_type == '22'){								
							//--------------------
							//沒有發票號碼時抓其他憑證號碼							
							var guiNo22 = result.getValue({name: "custrecord_10_gui_no"}); //進項發票號碼
							    if (guiNo22 == '') {
									guiNo = result.getValue({name: "custrecord_10_other_desc"}); //其他憑證號碼
								      guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元									
								}
								//2019.11.08 調整
								var sale_total_amt = result.getValue({name: "custrecord_10_sales_total_amt"}); //憑證含稅總額
								      guiAmount = sale_total_amt;
									    guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
									  taxAmount = '0';
								        taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
							}
							if (format_type == '25'){//如果沒有發票號碼時抓公營載具號碼
							//--------------------
							var guiNo25 = result.getValue({name: "custrecord_10_gui_no"}); //進項發票號碼
							    if (guiNo25 == '') {
									guiNo = result.getValue({name: "custrecord_10_public_vehicle"}); //公營載具號碼
								      guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元									
								}
							}
							if (format_type != '99'){
							//--------------------
						    Inv11iTxtArr.push(new Array(format_type, regNumber, seqNumber, guiDateY, guiDateM
													  , buyGUInumber, selGUInumber, guiNo, guiAmount, taxCode
													  , taxAmount, deductionCode, emptyChar
													  , specTax, note, clearType
													  ));
							}							
						   return true;
						});
						//↑↑↑ 進項發票資料內容
					}
					//↑↑↑ 進項發票Search --------------------					
					
					
					//↓↓↓ 進折發票Search --------------------
					if (loadScope==1 || loadScope==3) {
					var Search_12_Inv = search.create({
					   type: "customrecord_ev_pay_cm_all", 
					   filters:[ ["custrecord_12_registration_number.name","is",rgd01],
						  "AND", ["custrecord_12_occured_year","equalto",p_GuiYear], 
						  "AND", ["custrecord_12_occured_month","greaterthanorequalto",p_GuiM1], 
						  "AND", ["custrecord_12_occured_month","lessthanorequalto",p_GuiM2]
					   ],
					   columns:
					   [
						  search.createColumn({name: "internalid", label: "Internal ID" }), //2019.11.11
						  search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name"}),  //進折編號
						  search.createColumn({name: "custrecord_12_gui_confirm", label: "GUI Confirm"}),
						  search.createColumn({name: "custrecord_12_void_flag", label: "作廢"}),
						  search.createColumn({name: "custrecord_12_format_type", label: "進折格式別"}),  //進折格式別
						  search.createColumn({name: "custrecord_12_occured_year", label: "進折所屬年"}),
						  search.createColumn({name: "custrecord_12_occured_month", label: "進折所屬月"}),
						  search.createColumn({name: "custrecord_12_cut_code", label: "扣抵代號"}),
						  search.createColumn({name: "custrecord_12_registration_number", label: "稅籍編號"}),
						  search.createColumn({name: "custrecord_12_vendor_name", label: "進折廠商名稱"}),
						  search.createColumn({name: "custrecord_12_sales_no", label: "進折廠商統一編號"}),
						  search.createColumn({name: "custrecord_12_vat_io", label: "進折折讓稅額"}),
						  search.createColumn({name: "custrecord_12_sales_amt", label: "進折折讓金額"}),
						  search.createColumn({name: "custrecord_12_tax_code", label: "進折課稅別"}),
						  search.createColumn({name: "custrecord_12_cut_type", label: "扣抵種類"})
						  //search.createColumn({name: "custrecord_12_upload_status", label: "申報狀態"})
					   ]	
					});				
						var Search_12_InvCnt = Search_12_Inv.runPaged().count;						
						//↓↓↓ 進折發票資料內容
						Search_12_Inv.run().each(function(result){ // .run().each has a limit of 4,000 results
						   //--------------------
						    var Inv12InternalID = result.getText({name: "internalid"}); //2019.11.11
							format_type = result.getText({name: "custrecord_12_format_type"}); //進折項格式別
								format_type = format_type.substring(0,2);							
						    var guiDateY = result.getValue({name: "custrecord_12_occured_year"}); //進折所屬年
							    guiDateY = guiDateY - 1911;
							var guiDateM = result.getValue({name: "custrecord_12_occured_month"}); //進折所屬月
							    guiDateM = txtStringPrcess(2,guiDateM.length,guiDateM,'0');
							buyGUInumber = defUniNo; //進項: 買受人統一編號 => 公司統一編號
								buyGUInumber = txtStringPrcess(8,buyGUInumber.length,buyGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							selGUInumber = result.getValue({name: "custrecord_12_sales_no"}); //進折廠商統一編號
								selGUInumber = txtStringPrcess(8,selGUInumber.length,selGUInumber,' ');//總長度,字串長度,傳入字串,補字元
							//guiNo = result.getValue({name: "name"}); //進折編號
							//	guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
							// guiAmount = result.getValue({name: "custrecord_12_sales_amt"}); //進折折讓金額 
								// guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元
							taxCode = result.getValue({name: "custrecord_12_tax_code"}); //課稅別
								taxCode = txtStringPrcess(1,taxCode.length,taxCode,'0');//總長度,字串長度,傳入字串,補字元
							// taxAmount = result.getValue({name: "custrecord_12_vat_io"}); //憑證稅額
								// taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
							deductionCode = result.getValue({name: "custrecord_12_cut_code"});  //抵扣代號
								deductionCode = txtStringPrcess(1,deductionCode.length,deductionCode,' ');//總長度,字串長度,傳入字串,補字元
							emptyChar = ''; //空白
								emptyChar = txtStringPrcess(5,emptyChar.length,emptyChar,' ');//總長度,字串長度,傳入字串,補字元
							specTax = ''; //特種稅額稅率(1)_空白
								specTax = txtStringPrcess(1,specTax.length,specTax,' ');//總長度,字串長度,傳入字串,補字元
							note = ''; //彙加註記(1)_空白
								note = txtStringPrcess(1,note.length,note,' ');//總長度,字串長度,傳入字串,補字元
							clearType = ''; //通關方式(1)_空白
								clearType = txtStringPrcess(1,clearType.length,clearType,' ');//總長度,字串長度,傳入字串,補字元
							//進折沒有做作廢
							
							//進折明細
							var pcm_guino  = result.getValue({name: "name"});
							pcm_guino = Inv12InternalID;
							//log.debug('進折','進折ID(pcm_guino):'+pcm_guino);
							
								var Search_12D_Inv = search.create({
								   type: "customrecord_ev_pay_cm_lines_all",
								   //filters:[["custrecord_13_parent_id","anyof","1"]],
								   filters:[["custrecord_13_parent_id","anyof",pcm_guino]],
								   columns:[									  
									  search.createColumn({name: "custrecord_13_gui_number", label: "憑證號碼"}),
									  search.createColumn({name: "custrecord_13_parent_id", label: "PARENT_ID"}),
									  search.createColumn({name: "custrecord_13_vendor_id", label: "廠商名稱"}),
									  search.createColumn({name: "custrecord_13_gui_date", label: "憑證日期"}),
									  search.createColumn({name: "custrecord_13_gui_sales_amt", label: "憑證金額"}),
									  search.createColumn({name: "custrecord_13_gui_vat_io", label: "憑證稅額"}),
									  search.createColumn({name: "custrecord_13_cm_gui_line_amount", label: "已折讓金額"}),
									  search.createColumn({name: "custrecord_13_cm_gui_tax_amount", label: "已折讓稅額"}),
									  search.createColumn({name: "custrecord_13_line_ntd_amount", label: "折讓金額"}),
									  search.createColumn({name: "custrecord_13_tax_ntd_amount", label: "折讓稅額"})
								   ]
								});
								var Search_12D_InvCnt = Search_12D_Inv.runPaged().count;
								Search_12D_Inv.run().each(function(result){
								   // .run().each has a limit of 4,000 results
								   guiNo = result.getText({name: "custrecord_13_gui_number"}); //進折編號
							       guiNo = txtStringPrcess(10,guiNo.length,guiNo,' ');//總長度,字串長度,傳入字串,補字元
								   guiAmount = result.getValue({name: "custrecord_13_line_ntd_amount"}); //進折折讓金額 
								   guiAmount = txtStringPrcess(12,guiAmount.length,guiAmount,'0');//總長度,字串長度,傳入字串,補字元							       
								   taxAmount = result.getValue({name: "custrecord_13_tax_ntd_amount"}); //憑證稅額
								   taxAmount = txtStringPrcess(10,taxAmount.length,taxAmount,'0');//總長度,字串長度,傳入字串,補字元
								   var Inv12Lid = result.getValue({name: "custrecord_13_parent_id"}); //PARENT_ID 
								   //log.debug('進折','進折ID:'+Inv12Lid);
							
								//--------------------
								Inv12iTxtArr.push(new Array(format_type, regNumber, seqNumber, guiDateY, guiDateM
														  , buyGUInumber, selGUInumber, guiNo, guiAmount, taxCode
														  , taxAmount, deductionCode, emptyChar
														  , specTax, note, clearType
														  ));								   
								   return true;
								});							
							//--------------------						    
						    return true;
						});
						//↑↑↑ 進折發票資料內容
					}
					//↑↑↑ 進折發票Search --------------------






	

					

					seqCount = 0;
					//組字串-銷項 ========================================================================= 
					for ( var i=0 ; i<Inv21oTxtArr.length ; i++ ) {
					        // //流水號處理-----
							seqCount = seqCount + 1;
							seqNumber = seqCount.toString();
							var seqLength = seqNumber.length;//目前流水號字元數
						    var seqNumN = txtStringPrcess(7,seqLength,seqNumber,'0');//總長度,字串長度,傳入字串,補字元
							// //流水號處理-----
						//字串
						var splitChar = ''; //for test
					    fileTxt = fileTxt + Inv21oTxtArr[i][0]  + splitChar // 1.格式別
						fileTxt = fileTxt + Inv21oTxtArr[i][1]  + splitChar // 2.稅籍編號
						fileTxt = fileTxt + Inv21oTxtArr[i][2]  + seqNumN   // 3.流水號 //splitChar  seqNumber
						fileTxt = fileTxt + Inv21oTxtArr[i][3]  + splitChar // 4.年度
						fileTxt = fileTxt + Inv21oTxtArr[i][4]  + splitChar // 5.月份
						fileTxt = fileTxt + Inv21oTxtArr[i][5]  + splitChar // 6.買受人統編
						fileTxt = fileTxt + Inv21oTxtArr[i][6]  + splitChar // 7.銷售人統編
						fileTxt = fileTxt + Inv21oTxtArr[i][7]  + splitChar // 8.統一發票
						fileTxt = fileTxt + Inv21oTxtArr[i][8]  + splitChar // 9.銷售金額
						fileTxt = fileTxt + Inv21oTxtArr[i][9]  + splitChar //10.課稅別
						fileTxt = fileTxt + Inv21oTxtArr[i][10] + splitChar //11.營業稅額
						fileTxt = fileTxt + Inv21oTxtArr[i][11] + splitChar //12.抵扣代號
						fileTxt = fileTxt + Inv21oTxtArr[i][12] + splitChar //13.空白
						fileTxt = fileTxt + Inv21oTxtArr[i][13] + splitChar //14.特種稅額稅率
						fileTxt = fileTxt + Inv21oTxtArr[i][14] + splitChar //15.彙加註記
						fileTxt = fileTxt + Inv21oTxtArr[i][15] + splitChar //16.通關方式
						//fileTxt = fileTxt + Inv21oTxtArr[i][16] + splitChar //暫:作廢flag
						fileTxt = fileTxt + '\r\n'
					}
					//組字串-銷項 =========================================================================
					
					//組字串-36格式 ========================================================================= 
					for ( var i=0 ; i<Inv36oTxtArr.length ; i++ ) {
					        // //流水號處理-----
							seqCount = seqCount + 1;
							seqNumber = seqCount.toString();
							var seqLength = seqNumber.length;//目前流水號字元數
						    var seqNumN = txtStringPrcess(7,seqLength,seqNumber,'0');//總長度,字串長度,傳入字串,補字元
							// //流水號處理-----
						//字串
						var splitChar = ''; //for test
					    fileTxt = fileTxt + Inv36oTxtArr[i][0]  + splitChar // 1.格式別
						fileTxt = fileTxt + Inv36oTxtArr[i][1]  + splitChar // 2.稅籍編號
						fileTxt = fileTxt + Inv36oTxtArr[i][2]  + seqNumN   // 3.流水號 //splitChar  seqNumber
						fileTxt = fileTxt + Inv36oTxtArr[i][3]  + splitChar // 4.年度
						fileTxt = fileTxt + Inv36oTxtArr[i][4]  + splitChar // 5.月份
						fileTxt = fileTxt + Inv36oTxtArr[i][5]  + splitChar // 6.買受人統編
						fileTxt = fileTxt + Inv36oTxtArr[i][6]  + splitChar // 7.銷售人統編
						fileTxt = fileTxt + Inv36oTxtArr[i][7]  + splitChar // 8.統一發票
						fileTxt = fileTxt + Inv36oTxtArr[i][8]  + splitChar // 9.銷售金額
						fileTxt = fileTxt + Inv36oTxtArr[i][9]  + splitChar //10.課稅別
						fileTxt = fileTxt + Inv36oTxtArr[i][10] + splitChar //11.營業稅額
						fileTxt = fileTxt + Inv36oTxtArr[i][11] + splitChar //12.抵扣代號
						fileTxt = fileTxt + Inv36oTxtArr[i][12] + splitChar //13.空白
						fileTxt = fileTxt + Inv36oTxtArr[i][13] + splitChar //14.特種稅額稅率
						fileTxt = fileTxt + Inv36oTxtArr[i][14] + splitChar //15.彙加註記
						fileTxt = fileTxt + Inv36oTxtArr[i][15] + splitChar //16.通關方式
						fileTxt = fileTxt + '\r\n'
					}
					//組字串-36格式 =========================================================================

					//組字串-空白發票 ======================================================================== 
					for ( var i=0 ; i<InvBlankTxtArr.length ; i++ ) {
						// //流水號處理-----
						seqCount = seqCount + 1;
						seqNumber = seqCount.toString();
						var seqLength = seqNumber.length;//目前流水號字元數
						var seqNumN = txtStringPrcess(7,seqLength,seqNumber,'0');//總長度,字串長度,傳入字串,補字元
						// //流水號處理-----
					//字串
					var splitChar = ''; //for test
					fileTxt = fileTxt + InvBlankTxtArr[i][0]  + splitChar // 1.格式別
					fileTxt = fileTxt + InvBlankTxtArr[i][1]  + splitChar // 2.稅籍編號
					fileTxt = fileTxt + InvBlankTxtArr[i][2]  + seqNumN   // 3.流水號 //splitChar  seqNumber
					fileTxt = fileTxt + InvBlankTxtArr[i][3]  + splitChar // 4.年度
					fileTxt = fileTxt + InvBlankTxtArr[i][4]  + splitChar // 5.月份
					fileTxt = fileTxt + InvBlankTxtArr[i][5]  + splitChar // 6.買受人統編
					fileTxt = fileTxt + InvBlankTxtArr[i][6]  + splitChar // 7.銷售人統編
					fileTxt = fileTxt + InvBlankTxtArr[i][7]  + splitChar // 8.統一發票
					fileTxt = fileTxt + InvBlankTxtArr[i][8]  + splitChar // 9.銷售金額
					fileTxt = fileTxt + InvBlankTxtArr[i][9]  + splitChar //10.課稅別
					fileTxt = fileTxt + InvBlankTxtArr[i][10] + splitChar //11.營業稅額
					fileTxt = fileTxt + InvBlankTxtArr[i][11] + splitChar //12.抵扣代號
					fileTxt = fileTxt + InvBlankTxtArr[i][12] + splitChar //13.空白
					fileTxt = fileTxt + InvBlankTxtArr[i][13] + splitChar //14.特種稅額稅率
					fileTxt = fileTxt + InvBlankTxtArr[i][14] + splitChar //15.彙加註記
					fileTxt = fileTxt + InvBlankTxtArr[i][15] + splitChar //16.通關方式
					fileTxt = fileTxt + '\r\n'
				}
				//組字串-空白發票 ========================================================================







					
					//組字串-銷折 ========================================================================= 
					for ( var i=0 ; i<Inv22oTxtArr.length ; i++ ) {
					        // //流水號處理-----
							seqCount = seqCount + 1;
							seqNumber = seqCount.toString();
							var seqLength = seqNumber.length;//目前流水號字元數
						    var seqNumN = txtStringPrcess(7,seqLength,seqNumber,'0');//總長度,字串長度,傳入字串,補字元
							// //流水號處理-----
						//字串
						var splitChar = ''; //for test
					    fileTxt = fileTxt + Inv22oTxtArr[i][0]  + splitChar // 1.格式別
						fileTxt = fileTxt + Inv22oTxtArr[i][1]  + splitChar // 2.稅籍編號
						fileTxt = fileTxt + Inv22oTxtArr[i][2]  + seqNumN   // 3.流水號 //splitChar  seqNumber
						fileTxt = fileTxt + Inv22oTxtArr[i][3]  + splitChar // 4.年度
						fileTxt = fileTxt + Inv22oTxtArr[i][4]  + splitChar // 5.月份
						fileTxt = fileTxt + Inv22oTxtArr[i][5]  + splitChar // 6.買受人統編
						fileTxt = fileTxt + Inv22oTxtArr[i][6]  + splitChar // 7.銷售人統編
						fileTxt = fileTxt + Inv22oTxtArr[i][7]  + splitChar // 8.統一發票
						fileTxt = fileTxt + Inv22oTxtArr[i][8]  + splitChar // 9.銷售金額
						fileTxt = fileTxt + Inv22oTxtArr[i][9]  + splitChar //10.課稅別
						fileTxt = fileTxt + Inv22oTxtArr[i][10] + splitChar //11.營業稅額
						fileTxt = fileTxt + Inv22oTxtArr[i][11] + splitChar //12.抵扣代號
						fileTxt = fileTxt + Inv22oTxtArr[i][12] + splitChar //13.空白
						fileTxt = fileTxt + Inv22oTxtArr[i][13] + splitChar //14.特種稅額稅率
						fileTxt = fileTxt + Inv22oTxtArr[i][14] + splitChar //15.彙加註記
						fileTxt = fileTxt + Inv22oTxtArr[i][15] + splitChar //16.通關方式
						//fileTxt = fileTxt + Inv22oTxtArr[i][16] + splitChar //暫:作廢flag
						fileTxt = fileTxt + '\r\n'
					}
					//組字串-銷折 =========================================================================
					
					//組字串-進項 ========================================================================= 
					for ( var i=0 ; i<Inv11iTxtArr.length ; i++ ) {
					        // //流水號處理-----
							seqCount = seqCount + 1;
							seqNumber = seqCount.toString();
							var seqLength = seqNumber.length;//目前流水號字元數
						    var seqNumN = txtStringPrcess(7,seqLength,seqNumber,'0');//總長度,字串長度,傳入字串,補字元
							// //流水號處理-----
						//字串
						var splitChar = ''; //for test
					    fileTxt = fileTxt + Inv11iTxtArr[i][0]  + splitChar // 1.格式別
						fileTxt = fileTxt + Inv11iTxtArr[i][1]  + splitChar // 2.稅籍編號
						fileTxt = fileTxt + Inv11iTxtArr[i][2]  + seqNumN   // 3.流水號 //splitChar  seqNumber
						fileTxt = fileTxt + Inv11iTxtArr[i][3]  + splitChar // 4.年度
						fileTxt = fileTxt + Inv11iTxtArr[i][4]  + splitChar // 5.月份
						fileTxt = fileTxt + Inv11iTxtArr[i][5]  + splitChar // 6.買受人統編
						fileTxt = fileTxt + Inv11iTxtArr[i][6]  + splitChar // 7.銷售人統編
						fileTxt = fileTxt + Inv11iTxtArr[i][7]  + splitChar // 8.統一發票
						fileTxt = fileTxt + Inv11iTxtArr[i][8]  + splitChar // 9.銷售金額
						fileTxt = fileTxt + Inv11iTxtArr[i][9]  + splitChar //10.課稅別
						fileTxt = fileTxt + Inv11iTxtArr[i][10] + splitChar //11.營業稅額
						fileTxt = fileTxt + Inv11iTxtArr[i][11] + splitChar //12.抵扣代號
						fileTxt = fileTxt + Inv11iTxtArr[i][12] + splitChar //13.空白
						fileTxt = fileTxt + Inv11iTxtArr[i][13] + splitChar //14.特種稅額稅率
						fileTxt = fileTxt + Inv11iTxtArr[i][14] + splitChar //15.彙加註記
						fileTxt = fileTxt + Inv11iTxtArr[i][15] + splitChar //16.通關方式
						//fileTxt = fileTxt + Inv11iTxtArr[i][16] + splitChar //暫:作廢flag
						fileTxt = fileTxt + '\r\n'
					}
					//組字串-進項 =========================================================================
					
					//組字串-進折 ========================================================================= 
					for ( var i=0 ; i<Inv12iTxtArr.length ; i++ ) {
					        // //流水號處理-----
							seqCount = seqCount + 1;
							seqNumber = seqCount.toString();
							var seqLength = seqNumber.length;//目前流水號字元數
						    var seqNumN = txtStringPrcess(7,seqLength,seqNumber,'0');//總長度,字串長度,傳入字串,補字元
							// //流水號處理-----
						//字串
						var splitChar = ''; //for test
					    fileTxt = fileTxt + Inv12iTxtArr[i][0]  + splitChar // 1.格式別
						fileTxt = fileTxt + Inv12iTxtArr[i][1]  + splitChar // 2.稅籍編號
						fileTxt = fileTxt + Inv12iTxtArr[i][2]  + seqNumN   // 3.流水號 //splitChar  seqNumber
						fileTxt = fileTxt + Inv12iTxtArr[i][3]  + splitChar // 4.年度
						fileTxt = fileTxt + Inv12iTxtArr[i][4]  + splitChar // 5.月份
						fileTxt = fileTxt + Inv12iTxtArr[i][5]  + splitChar // 6.買受人統編
						fileTxt = fileTxt + Inv12iTxtArr[i][6]  + splitChar // 7.銷售人統編
						fileTxt = fileTxt + Inv12iTxtArr[i][7]  + splitChar // 8.統一發票
						fileTxt = fileTxt + Inv12iTxtArr[i][8]  + splitChar // 9.銷售金額
						fileTxt = fileTxt + Inv12iTxtArr[i][9]  + splitChar //10.課稅別
						fileTxt = fileTxt + Inv12iTxtArr[i][10] + splitChar //11.營業稅額
						fileTxt = fileTxt + Inv12iTxtArr[i][11] + splitChar //12.抵扣代號
						fileTxt = fileTxt + Inv12iTxtArr[i][12] + splitChar //13.空白
						fileTxt = fileTxt + Inv12iTxtArr[i][13] + splitChar //14.特種稅額稅率
						fileTxt = fileTxt + Inv12iTxtArr[i][14] + splitChar //15.彙加註記
						fileTxt = fileTxt + Inv12iTxtArr[i][15] + splitChar //16.通關方式
						//fileTxt = fileTxt + Inv12iTxtArr[i][16] + splitChar //暫:作廢flag
						fileTxt = fileTxt + '\r\n'
					}
					//組字串-進折 =========================================================================
					
					

					
					
					//檔案處理 ======================================					
					var fileContent = '';
					var folderid = util.getFolderId('MediaFile');
				                
					//寫入檔案
					fileContent = fileContent + fileTxt
					//fileContent = fileContent + '\n' + '筆數' + '\n'
					var fileObj = file.create({
						name: defUniNo +'.txt',
						fileType: file.Type.PLAINTEXT,
						contents: fileContent 
						});
					fileObj.folder = folderid; //將檔案存在指定目錄
					var fileId = fileObj.save();
					
						var fileload = file.load({
							id: fileId
						});	
					
					//檔案URL
					var fileURL1 = fileload.url;	
					//檔案處理 ======================================				
					
				//SaveSearch + 組檔案 --------------------
				
					
				
					
					
				//-----------------------------------------------
                //結果回報頁面 ----------------------------------
				var form = serverWidget.createForm({
					title : "媒體檔申報 -- 檔案下載結果 " // + loadScope + ' ' + rgd04 + ' ' + rgd05
				});  				 
					
				// ============== 表頭COLUMNS ==============
				var fieldgroup_columns = form.addFieldGroup({
					id : 'custpage_RG1',
					label : '營業人進/銷項資料檔'
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
					if (rgd02=='1') {rgd02show='進項';}
					if (rgd02=='2') {rgd02show='銷項';}
					if (rgd02=='3') {rgd02show='進銷項';}
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
					RA8.defaultValue = fileURL1;
					RA8.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });	

				
				//-----------------------------------	
				context.response.writePage(form);
				//-----------------------------------	
				
            }
        }
		
		
        return {
            onRequest: onRequest
        };
    });