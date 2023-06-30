/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/record','N/search','N/ui/message','./commonAPI/Common_ColumnCheck','./commonAPI/commonUtil','N/currentRecord','N/error', 'N/format'],
function(record,search,message,common,Util,cRecord,error, format) {
    function _pageInit(context)
	{
        // [按鈕] Copy previous
        var expense_copyObj = document.getElementById("expense_copy");
        if( expense_copyObj )
        {
            expense_copyObj.onclick = function() {
                eval("expense_machine.copyline();");
                var currentRecord = context.currentRecord;
                currentRecord.setCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "custcol_gv_pay_id" ,
                    value:''
                })
                currentRecord.setCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "custcol_gv_pay_no" ,
                    value:''
                })
             
            }
        }
    }
    function validateField(context) {

        var currentRecord = cRecord.get();
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        var line = context.line;
        var trxn_noID ="expense";
        var LineCount = currentRecord.getLineCount({"sublistId": trxn_noID});
        var FieldValue = "";
        var FieldText = "";
        //console.log("fieldId:"+context.fieldId+" ,sublistId:"+context.sublistId + " ,Record:"+context.currentRecord + " ,line:"+context.line+" ,LineCount:"+LineCount);
        if(sublistName){
			FieldValue = currentRecord.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: sublistFieldName,
                line: line
            });
            FieldText = currentRecord.getCurrentSublistText({
                sublistId: sublistName,
                fieldId: sublistFieldName,
                line: line
            });
            //console.log(sublistFieldName+":"+FieldValue);
		}else{
            FieldValue = currentRecord.getValue(sublistFieldName);
            FieldText = currentRecord.getText(sublistFieldName);
			//console.log(sublistFieldName+":"+FieldValue);
		}
        
        if(sublistName === "expense"){
            //getCurrentSublistValue    現在畫面的資料
            //getSublistValue   只能用在已儲存的資料
            if(FieldValue==="" && sublistFieldName != "custcol_gv_format_type")
                return true;

            //console.log("FieldValue:"+FieldValue);
            var formatType_text = currentRecord.getCurrentSublistText({
                sublistId: sublistName,
                fieldId: "custcol_gv_format_type",
                line: line
            });

            if(sublistFieldName === "custcol_gv_vendor_vat_no")/*銷售人統一編號*/{
                if(FieldValue=="")
                    return true;
                if(!Util.isValidGUI(FieldValue) ){
                    showMessage("系統訊息","此統一編號不符合邏輯");
                }
            }else if(sublistFieldName === "custcol_gv_format_type")/*憑證格式別*/{   
                var gui_noID = "custcol_gv_gui_no"; //發票號碼
                var other_descID = "custcol_gv_other_desc";   //其他憑證號碼
                var public_vehicleID = "custcol_gv_public_vehicle";  //公用事業載具(25)
                var tax_collID = "custcol_gv_customs_tax_coll";//海關代徵營業稅繳納證號碼

                switch(common.GetSerialNumberText(FieldText)){
                    case "22" :
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: gui_noID,line: line}).isDisabled = false;    //發票號碼檢核
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: other_descID,line: line}).isDisabled = false;    //其他憑證號碼
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: public_vehicleID,line: line}).isDisabled = true; //公用事業載具(25)
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: public_vehicleID,
                            line: line,
                            value: ""
                        });
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: tax_collID,line: line}).isDisabled = true;   //海關代徵營業稅繳納證號碼
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: tax_collID,
                            line: line,
                            value: ""
                        });
                        break;
                    case "25" :
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: gui_noID,line: line}).isDisabled = false;    //發票號碼檢核
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: other_descID,line: line}).isDisabled = true;    //其他憑證號碼
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: other_descID,
                            line: line,
                            value: ""
                        });
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: public_vehicleID,line: line}).isDisabled = false;    //公用事業載具(25)

                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: tax_collID,line: line}).isDisabled = true;    //海關代徵營業稅繳納證號碼
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: tax_collID,
                            line: line,
                            value: ""
                        });
                    case "28" :
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: gui_noID,line: line}).isDisabled = true;    //發票號碼檢核
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: gui_noID,
                            line: line,
                            value: ""
                        });
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: other_descID,line: line}).isDisabled = true;    //其他憑證號碼
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: other_descID,
                            line: line,
                            value: ""
                        });
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: public_vehicleID,line: line}).isDisabled = true; //公用事業載具(25)
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: public_vehicleID,
                            line: line,
                            value: ""
                        });
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: tax_collID,line: line}).isDisabled = false;    //海關代徵營業稅繳納證號碼
                        break;
                    default:
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: gui_noID,line: line}).isDisabled = true;    //發票號碼檢核
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: gui_noID,
                            line: line,
                            value: ""
                        });
                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: other_descID,line: line}).isDisabled = true;    //其他憑證號碼
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: other_descID,
                            line: line,
                            value: ""
                        });

                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: public_vehicleID,line: line}).isDisabled = true; //公用事業載具(25)
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: public_vehicleID,
                            line: line,
                            value: ""
                        });

                        //currentRecord.getSublistField({sublistId: sublistName,fieldId: tax_collID,line: line}).isDisabled = true;    //海關代徵營業稅繳納證號碼
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: tax_collID,
                            line: line,
                            value: ""
                        });  
                        break;
                }
            }else if(sublistFieldName === "custcol_gv_other_desc")/*其他憑證號碼*/{
                if(common.GetSerialNumberText(formatType_text)=='22'){
                    if(IsUnModified(context))
                        return true;
                    common.OtherDescCheck(FieldValue);
                }else if //2019/4/14 add by amy
                    (common.GetSerialNumberText(formatType_text)=='99'){
                    if(IsUnModified(context))
                        return true;
                    common.OtherDescCheck99(FieldValue);
                }else if(FieldValue!=""){
                    showMessage('系統訊息','格式別不為22，其他憑證號碼需為空值');
                    return false;
                }
            }else if(sublistFieldName === "taxcode")/*廠商稅碼*/{

                FieldText = FieldText.split(":")
                FieldText = FieldText[0];

                var TaxCodeMappingPromise = common.GetTaxCodeMapping(FieldText,'name','p');
                TaxCodeMappingPromise.then(function(result){
                    //console.log('result:'+result);
                    if(result!=null){
                        currentRecord.setCurrentSublistValue({
                            sublistId: trxn_noID,
                            fieldId: "custcol_gv_format_type",
                            line: line,
                            value: result[0]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: trxn_noID,
                            fieldId: "custcol_gv_tax_code",
                            line: line,
                            value: result[1]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: trxn_noID,
                            fieldId: "custcol_gv_tax_calc_type",
                            line: line,
                            value: result[2]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: trxn_noID,
                            fieldId: "custcol_gv_cut_code",
                            line: line,
                            value: result[4]
                        });
                    }
                }).catch(function(reason) {
                    console.log('reason:'+reason);                    
                    return null;
                });

                var salesamt= currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: "grossamt",
                    line: line
                });
                if(salesamt!=""){
                    SetTaxAmout(salesamt,FieldText,line);
                }  

            }else if(sublistFieldName === "custcol_gv_gui_no")/*發票號碼檢核 custrecord_10_gui_no*/{
                if(formatType_text.toString().length > 2 && (formatType_text.toString().substring(0,2)=='21' || formatType_text.toString().substring(0,2)=='22' || formatType_text.toString().substring(0,2)=='25' || formatType_text.toString().substring(0,2)=='99')){
                    
                }else if(FieldValue!=""){
                    showMessage('系統訊息','格式別不為21,22,25,99，發票號碼需為空值');
                    return false;
                }

                if(IsUnModified(context))
                    return true;
                var date = currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: "expensedate",
                        line: line
                });
                var year = 0;
                var month = 0;
                if(date!=null && date!=""){
                    year = date.getFullYear();  //憑證日期 年
                    month = date.getMonth()+1;  //憑證日期 月
                    common.invoiceCheck(FieldValue,year,month);
                }
            }else if(sublistFieldName === "custcol_gv_public_vehicle")/*公用事業載具(25)*/{
                if(formatType_text.toString().length > 2 && formatType_text.toString().substring(0,2)=='25'){
                    if(IsUnModified(context))
                        return true;
                    common.PublicVehicleCheck(FieldValue);
                }else if(FieldValue!=""){
                    showMessage('系統訊息','格式別不為25，公用事業載具需為空值');
                    return false;
                }
            }else if(sublistFieldName === "custcol_gv_customs_tax_coll")/*海關代徵營業稅繳納證號碼*/{
                if(formatType_text.toString().length > 2 && formatType_text.toString().substring(0,2)=='28'){
                    if(IsUnModified(context))
                        return true;
                    common.TaxCollCheck(FieldValue);
                }else if(FieldValue!=""){
                    showMessage('系統訊息','格式別不為28，海關代徵營業稅繳納證號碼需為空值');
                    return false;
                }
            }else if(sublistFieldName === "grossamt")/*銷售金額*/{
                var taxtype= currentRecord.getCurrentSublistText({
                    sublistId: sublistName,
                    fieldId: "taxcode",
                    line: line
                });
                taxtype = taxtype.split(":")
                taxtype = taxtype[0];

                if(FieldValue==="" || taxtype==""){
                    return true;
                }
                SetTaxAmout(FieldValue,taxtype,line); 
            }
        }
        return true;
    }

    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var trandate = currentRecord.getValue({fieldId: "trandate"});
        trandate = format.parse({value:trandate,type: format.Type.DATE});
        var checkdate = new Date("11/23/2019");
        //var IsError = false;
        var ErrorMessage = "";  //錯誤訊息
        var trxn_noID = "expense";
        var LineCount = currentRecord.getLineCount({"sublistId": trxn_noID}); //進項發票資訊的sublist數
        var gui_noID = "custcol_gv_gui_no" //發票號碼
        var other_descID = "custcol_gv_other_desc"   //其他憑證號碼
        var public_vehicleID = "custcol_gv_public_vehicle";  //公用事業載具(25)
        var tax_collID = "custcol_gv_customs_tax_coll";
        var sales_noID = "custcol_gv_vendor_vat_no";
        var format_type = "custcol_gv_format_type";
        var tax_code = "taxcode";//taxcode
        // var cut_code = "custrecord_10_cut_code";//扣抵代號
        var Total_vatIo = 0;    //憑證稅額加總
        var Total_totalAmt = 0; //憑證含稅總額加總
        //2019/12/09 Matt新增 如果是舊視窗舊不做檢核
        if(trandate <checkdate){
            return true;
        }

        if(LineCount > 15){
            ErrorMessage += "ExpenReport無法超過15筆資料<br>";
        }


        for(var i =0;i<LineCount;i++){
            var orgRecord=null; //原本的的資料
            var id = currentRecord.getSublistValue({
                sublistId: trxn_noID,
                fieldId: "custcol_gv_pay_id",
                line: i
            });
            if(id!="" && id!=null){            
                orgRecord = record.load({
                    type: "customrecord_ev_pay_invoices_all", 
                    id: id,
                    isDynamic: true,
                });
            };

            var gui_date_year = parseInt(currentRecord.getSublistValue({ //憑證日期 年
                sublistId: trxn_noID,
                fieldId: "expensedate",
                line: i
            }).getFullYear());
            var gui_date_month = parseInt(currentRecord.getSublistValue({    //憑證日期 月
                sublistId: trxn_noID,
                fieldId: "expensedate",
                line: i
            }).getMonth())+1;
            var sales_no = currentRecord.getSublistValue({   //統一編號
                sublistId: trxn_noID,
                fieldId: sales_noID,
                line: i
            });
            var guiNo = currentRecord.getSublistValue({  //發票號碼
                sublistId: trxn_noID,
                fieldId: gui_noID,
                line: i
            });
            var formatType = currentRecord.getSublistText({ //格式別
                sublistId: trxn_noID,
                fieldId: format_type,
                line: i
            });
            var taxcode = currentRecord.getSublistValue({ //tax_code
                sublistId: trxn_noID,
                fieldId: tax_code,
                line: i
            });
            console.log("guiNo"+guiNo);

            var checkSalesNo = true;
            //憑證格式別
            switch(common.GetSerialNumberText(formatType)){
                //Matt 2019/05/10 新增 檢查"21"
                case "21" :
                    if(guiNo=="" ){
                        ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為21時發票號碼必須輸入<br>";
                    }
                    if(guiNo!="" 
                    && ((orgRecord!=null && orgRecord.getValue('custrecord_10_gui_no') != guiNo) || orgRecord==null)){
                        if(!common.invoiceCheck( guiNo ,gui_date_year,gui_date_month)){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，發票號碼檢核檢驗失敗<br>";
                        }
                        if(!common.TaxCodeCheckGuiWord(guiNo ,gui_date_year,gui_date_month,"21")){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為21時字軌需是有勾選[手開三聯]or[電子式]<br>";
                        }
                    }
                    break;
                case "22" :
                    var otherDesc = currentRecord.getSublistValue({
                        sublistId: trxn_noID,
                        fieldId: other_descID,
                        line: i
                    });
                    console.log("guiNo="+guiNo);
                    console.log("otherDesc="+otherDesc);
                    if(guiNo!="" && otherDesc!=""){
                        ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為22時發票號碼或其他憑證號碼不可同時輸入<br>";
                    }else if(guiNo=="" && otherDesc==""){
                        ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為22時發票號碼或其他憑證號碼必須二擇一輸入<br>";
                    }
                    if(guiNo!="" 
                    && ((orgRecord!=null && orgRecord.getValue('custrecord_10_gui_no') != guiNo) || orgRecord==null)){
                        if(!common.invoiceCheck(guiNo,gui_date_year,gui_date_month)){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，發票號碼檢核檢驗失敗<br>";
                        }
                        if(!common.TaxCodeCheckGuiWord(guiNo ,gui_date_year,gui_date_month,"22")){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為22時字軌需是有勾選[收銀機二聯式]or[手開二聯式]<br>";
                        }
                    }
                    if(otherDesc!="" 
                    && ((orgRecord!=null && orgRecord.getValue('custrecord_10_other_desc') != otherDesc) || orgRecord==null)){
                        if(!common.OtherDescCheck( otherDesc) ){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，其他憑證號碼檢驗失敗<br>";
                        }
                    }
                    if(guiNo==""){
                        checkSalesNo = false;   //格式為22時且發票號碼若為空值統編可為空白
                    }
                    break;
                case "25" :
                    //公用事業載具
                    var publicVehicle = currentRecord.getSublistValue({
                        sublistId: trxn_noID,
                        fieldId: public_vehicleID,
                        line: i
                    });
                    if(guiNo!="" && publicVehicle!=""){
                        ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為25時發票號碼或公營載具號碼不可同時輸入<br>";
                    }else if(guiNo=="" && publicVehicle==""){
                        ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為25時發票號碼或公營載具號碼必須二擇一輸入<br>";
                    }
                    //發票號碼不為空值 且 ((EDIT狀態下該值有改變)或是(CREATE狀態))
                    if(guiNo!="" 
                    && ((orgRecord!=null && orgRecord.getValue('custrecord_10_gui_no') != guiNo) || orgRecord==null)){
                        if(!common.invoiceCheck( guiNo ,gui_date_year,gui_date_month)){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，發票號碼檢核檢驗失敗<br>";
                        }
                        if(!common.TaxCodeCheckGuiWord(guiNo ,gui_date_year,gui_date_month,"25")){
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，格式為25時字軌需是有勾選[收銀機三聯式]or[電子發票]<br>";
                        }
                    }
                    //公用事業載具不為空值 且 ((EDIT狀態下該值有改變)或是(CREATE狀態)) 
                    if(publicVehicle!="" && ((orgRecord!=null && orgRecord.getValue('custrecord_10_public_vehicle') != publicVehicle) || orgRecord==null)){
                        if(!common.PublicVehicleCheck(publicVehicle)) //公用事業載具(25)
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，公用事業載具檢驗失敗<br>";
                    }
                    break;
                case "28" :
                    var taxColl = currentRecord.getSublistValue({
                        sublistId: trxn_noID,
                        fieldId: tax_collID,
                        line: i
                    });
                    if((orgRecord!=null && orgRecord.getValue('custrecord_10_customs_tax_coll') != taxColl) || orgRecord==null){
                        if(!common.TaxCollCheck(taxColl))   //海關代徵營業稅繳納證號碼
                            ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，海關代徵營業稅繳納證號碼有誤<br>";
                    }
                    if(guiNo==""){
                        checkSalesNo = false;   //格式為28時且發票號碼若為空值統編可為空白
                    }
                    break;
                default:
                    if(guiNo==""){
                        checkSalesNo = false;   //格式為99時且發票號碼若為空值統編可為空白
                    }
                    break;
            }
            //如果格式別不為22 或是格式為22或28時且發票號碼若為空值 且統一編號不為空值
            if(checkSalesNo || (!checkSalesNo && sales_no!="")){
                if(!Util.isValidGUI( sales_no )){
                    ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，此統一編號不符合邏輯<br>"
                }
            }
            //檢核taxcode不能空白
            if(taxcode =="" || taxcode ==null){
                ErrorMessage += "進項發票資訊第"+(i+1).toString()+"筆資料，Taxcode不能為空白<br>"
            }

            if(i< Math.round(LineCount/2)){

                for(var j=i+1;j<LineCount;j++){
                    var display_J = currentRecord.getSublistValue({
                        sublistId: trxn_noID,
                        fieldId: gui_noID,
                        line: j
                        });
                        if(display_J == guiNo && display_J !=""){
                        ErrorMessage += "[進項發票資訊] 發票號碼第"+(i+1).toString()+"筆資料與第"+(j+1).toString()+"筆資料重複<br>";
						}
					var display_K = currentRecord.getSublistValue({
                        sublistId: trxn_noID,
                        fieldId: other_descID,
                        line: j
                        });
						if(display_K == otherDesc && display_K !=""){
                        ErrorMessage += "[進項發票資訊] 其他憑證號碼第"+(i+1).toString()+"筆資料與第"+(j+1).toString()+"筆資料重複<br>";
						}
				}   
			}
        }       

        if(ErrorMessage!=""){
            new Util.dialogObj("alert","MSG","系統訊息", ErrorMessage+"資料檢核有誤，無法儲存").showDialog();
            return false;            
        }else{
            //go save
            return true;            
        }
    }

    function showMessage(title,context){
        var myMsg = message.create({
            title: title, 
            message: context, 
            type: message.Type.WARNING
        });
        // will disappear after 5s
        myMsg.show({
            duration: 5000
        });
    }

    function SetTaxAmout(amt,taxtype,line){
        //2019/07/23 Matt修改 expensereport抓TAX_CODE_MAPPING的TAX_RATE欄位
        //var taxRate = Util.GetTaxRate(taxtype);
        console.log("===amt===="+amt);
        var taxRate = GetTaxRate(taxtype);
        console.log("taxRate======="+taxRate);
        var currentRecord = cRecord.get();
        //2019/06/04 Matt新增 如果廠商稅碼為P300
        var fieldLookUp = search.lookupFields({
            type: 'customrecord_ev_tax_code_mapping',
            id: taxRate[0],
            columns: ['custrecord_m_customs_rate']
        });
        var customs_rate = fieldLookUp.custrecord_m_customs_rate;
        taxRate[1] = parseFloat(taxRate[1].replace('%', ''))/100;
        customs_rate = parseFloat(customs_rate.replace('%', ''))/100;
        console.log("fieldlookup="+customs_rate);
        if (customs_rate){
            currentRecord.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: 'tax1amt',
                line: line,
                value:  toNum(amt) 
            });
            currentRecord.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: 'amount',              
                line: line,
                value: 0
            });
            currentRecord.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: 'custcol_gv_customs_sales_amt',
                line: line,
                value: Math.round(toNum(amt)*(1/customs_rate))
            });
        }else{            
            currentRecord.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: 'tax1amt',
                line: line,
                value: toNum(amt) - Math.round(toNum(amt) / (taxRate[1]+1))
            });
            currentRecord.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: 'amount',              
                line: line,
                value: Math.round(toNum(amt) / (taxRate[1]+1))
            });
            currentRecord.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: 'custcol_gv_customs_sales_amt',
                line: line,
                value: ''
            });
        }              

    }
    //是edit且沒有異動的話 直接return不需做檢核
    function IsUnModified(context){
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        var line = context.line;
        var id = currentRecord.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: "custcol_gv_pay_id",
            line: line
        });
        if(id!=""){;
            var orgRecord = record.load({
                type: "customrecord_ev_pay_invoices_all", 
                id: id,
                isDynamic: true,
            });
            var FieldValue = currentRecord.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: sublistFieldName,
                line: line
            });
            var orgValue =orgRecord.getValue(sublistFieldName);
            console.log("FieldValue:"+FieldValue + " ,orgValue:"+orgValue);
            if(orgValue == FieldValue){
                console.log("資料"+sublistFieldName+"沒修改不須檢核");
                return true;
            }
        }
        return false;
    }
    function GetTaxRate(taxtype){
        var customrecord_ev_tax_code_mappingSearchObj = search.create({
            type: "customrecord_ev_tax_code_mapping",
            filters:
            [
                ['name','is',taxtype]
            ],
            columns:
            [
                search.createColumn({name: "custrecord_m_tax_rate"})     //Tax Code
            ]
        });
        var taxtypeid = "";
        var tax_rate = "";
        customrecord_ev_tax_code_mappingSearchObj.run().each(function(result){
            taxtypeid = result.id;
            tax_rate = result.getValue('custrecord_m_tax_rate');
        });
        return [taxtypeid, tax_rate];        
    }
    /**
     * @description 檢查：是否為數字(是：回傳原值；否：回傳0)
     * @param {stirng} value 欲檢查值
     * @returns {any} 
     */
    function toNum(value) {
        if (isNaN(value))
        {
            return 0;               
        }else{
            return Number(value);
        }
    }
	/**
	 * 抓取sublistValue
	 * cr.setCurrentSublistValue
	 * @param {*} cr 
	 * @param {*} sublistId 
	 */
    function sublistObj(cr,sublistId)
    {
        this.cr = cr;
        this.sublistId = sublistId;
    }
    sublistObj.prototype.setV = function(fId,v,fc) //ignoreFieldChange
 	{
        this.cr.setCurrentSublistValue({ 
            sublistId: this.sublistId, 
            fieldId: fId, 
            value: v, 
            ignoreFieldChange: fc
        });
	};

    sublistObj.prototype.getV = function(fId)
 	{
        this.cr.getCurrentSublistValue({ 
            sublistId: this.sublistId, 
            fieldId: fId
        });
 	};
    return {
        validateField: validateField,
        saveRecord: saveRecord,
        pageInit: _pageInit
        //lineInit: lineInit
    };
});
