/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/record','N/search','./commonAPI/commonUtil','./commonAPI/Common_ColumnCheck','N/ui/serverWidget','N/runtime', 'N/format','N/error'],
function(record,search,Util,common,ui,runtime, format,error) {

    function beforeLoad(context)
	{
        var form = context.form;
        var DefaultRecord = context.newRecord;
        var trxn_noID = "expense";
        // 任何狀態下都要Disable
        var SUBLIST_FIELDS = [
            "custcol_gv_format_type",
            "custcol_gv_tax_code",
            "custcol_gv_tax_calc_type",
            "custcol_gv_cut_code",
            "custcol_gv_pay_id",
            "custcol_gv_pay_no"
        ];
        for (var f in SUBLIST_FIELDS) {
            disableSublistField(context, "expense", SUBLIST_FIELDS[f]);    
        }            
        // 如果edit的狀態下，判斷APPROVAL STATUS[Approved]Disable
        if(context.type == 'edit'){
            var approvalstatus=DefaultRecord.getText("approvalstatus");
            var OTHER_SUBLIST_FIELDS = [
            "custcol_gv_vendor_vat_no",
            "taxcode",
            "expensedate",
            "custcol_gv_gui_no",
            "custcol_gv_other_desc",
            "custcol_gv_public_vehicle",
            "custcol_gv_customs_tax_coll",
            "grossamt",
            "amount",
            "tax1amt"
        ];
        log.debug("approvalstatus=",approvalstatus);
        if(approvalstatus=="Approved"){
                    for (var f in OTHER_SUBLIST_FIELDS) 
                        disableSublistField(context, "expense", OTHER_SUBLIST_FIELDS[f]);
                    
          }            
        }
    };

    function afterSubmit(context){
        var oRec = context.oldRecord;
        var nRec = context.newRecord;
        var trxn_noID ="expense";
        var markedArr = [];

        if(context.type == 'edit' || context.type == 'create'){
            var IsApproved = ( nRec.getValue('approvalstatus') == 2);   //1.Pending Approval    2.Approved
            var IsEditToApproved = (IsApproved && context.type == 'edit' && oRec.getText('approvalstatus')!=2);               
            try {
                // 建立與修改進項發票
                var trandate = nRec.getValue({fieldId: "trandate"});
                trandate = format.parse({value:trandate,type: format.Type.DATE});
                var checkdate = new Date("11/23/2019");
                if(trandate >checkdate){
                    var trxn_noID = "expense";
                    var LineCount = nRec.getLineCount({"sublistId": trxn_noID}); //進項發票資訊的sublist數
                    for(var i =0;i<LineCount;i++){
                        // var script = runtime.getCurrentScript();
                        // var usage = script.getRemainingUsage();
                        // log.debug("usage",usage);
                        //if(usage>100){
                            var trxn_noID ="expense";
                            var gui_noID = "custcol_gv_gui_no"; //發票號碼
                            var other_descID = "custcol_gv_other_desc";   //其他憑證號碼
                            var public_vehicleID = "custcol_gv_public_vehicle";  //公用事業載具(25)
                            var tax_collID = "custcol_gv_customs_tax_coll";  //28
                            var pay_name = "";
                            if(nRec.getSublistValue({sublistId: trxn_noID,fieldId: gui_noID,line: i})){
                                pay_name= nRec.getSublistValue({sublistId: trxn_noID,fieldId: gui_noID,line: i})
                            }else if(nRec.getSublistValue({sublistId: trxn_noID,fieldId: other_descID,line: i})){
                                pay_name= nRec.getSublistValue({sublistId: trxn_noID,fieldId: other_descID,line: i})
                            }else if(nRec.getSublistValue({sublistId: trxn_noID,fieldId: public_vehicleID,line: i})){
                                pay_name= nRec.getSublistValue({sublistId: trxn_noID,fieldId: public_vehicleID,line: i})
                            }else if(nRec.getSublistValue({sublistId: trxn_noID,fieldId: tax_collID,line: i})){
                                pay_name= nRec.getSublistValue({sublistId: trxn_noID,fieldId: tax_collID,line: i})
                            }
                            // (進項發票建立與修改) 說明:如果此進項發票已存在就修改 不然就建立
                            var pay_id = nRec.getSublistValue({sublistId: trxn_noID,fieldId: "custcol_gv_pay_id",line: i});
                            if(pay_id ==""){
                                var payRecord = record.create({
                                    type: 'customrecord_ev_pay_invoices_all',
                                    isDynamic: true
                                });
                            }else{
                                var payRecord = record.load({
                                    type: 'customrecord_ev_pay_invoices_all',
                                    id: pay_id,
                                    isDynamic: true,
                                });
                            }
                            //name
                            if(pay_name!=""){                            
                                payRecord.setValue({
                                    fieldId: 'name',
                                    value: pay_name
                                });
                            }
                            //created_from
                            payRecord.setValue({
                                fieldId: 'custrecord_10_created_from',
                                value: "Expense Report"
                            });
                            //CREATED TRXN NO
                            payRecord.setValue({
                                fieldId: 'custrecord_10_trxn_no',
                                value:nRec.id
                            });                        
                            //稅籍編號
                            var regObj = Util.getDefaultRegno(nRec.getValue('subsidiary'));
                            payRecord.setValue({ fieldId: 'custrecord_10_registration_number', value: regObj[2] }); 
                            payRecord.setValue({ fieldId: 'custrecord_10_subsidiary', value: regObj[4] });
                            payRecord.setValue({ fieldId: 'custrecord_10_uniform_no', value: regObj[3] });
    
                            //廠商統一編號
                            payRecord.setValue({
                                fieldId: 'custrecord_10_sales_no',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: "custcol_gv_vendor_vat_no",
                                    line: i
                                })
                            });
                            var taxtype= nRec.getSublistValue({
                                sublistId: trxn_noID,
                                fieldId: "taxcode",
                                line: i
                            });
							
							//start 2022/7/11 Search tax code from fields Tax Code or Description 
							var taxtypeCheck = taxtype; 
							var fieldLookUp = search.lookupFields({
									type: 'salestaxitem',
									id: taxtype,
									columns: ['itemid']
							});
							
							taxtype = fieldLookUp.itemid;
							
							var searchTaxCode = common.GetTaxCodeMappingNoPromise(taxtype,'name','p');
							
							if(searchTaxCode == null) {
								
								fieldLookUp = search.lookupFields({
									type: 'salestaxitem',
									id: taxtypeCheck,
									columns: ['description']
								});
								taxtype = fieldLookUp.description;
							}
							//end 2022/7/11 Search tax code from fields Tax Code or Description
                            
                            var taxRate = GetTaxRate(taxtype);
                             
                            //廠商稅碼
                            payRecord.setValue({
                                fieldId: 'custrecord_vendor_tax_code',
                                value: taxRate[0]
                            });   
              
                            var TaxCodeMappingPromise = common.GetTaxCodeMappingNoPromise(taxtype,'name','p');
                            if(TaxCodeMappingPromise!=null){                                  
                                //格式別
                                payRecord.setValue({
                                    fieldId : 'custrecord_10_format_type',
                                    value : TaxCodeMappingPromise[0]
                                });
                                //課稅別
                                payRecord.setValue({
                                    fieldId : 'custrecord_10_tax_code',
                                    value : TaxCodeMappingPromise[1]
                                });
                                //含稅類別
                                payRecord.setValue({
                                    fieldId : 'custrecord_10_tax_calc_type',
                                    value : TaxCodeMappingPromise[2]
                                });
                                //扣抵代號
                                payRecord.setValue({
                                    fieldId : 'custrecord_10_cut_code',
                                    value : TaxCodeMappingPromise[4]
                                });                            
                            }                        
    
                            //憑證日期
                            payRecord.setValue({
                                fieldId: 'custrecord_10_gui_date',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: "expensedate",
                                    line: i
                                })
                            });
                            //發票號碼
                            payRecord.setValue({
                                fieldId: 'custrecord_10_gui_no',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: gui_noID,
                                    line: i
                                })
                            });
                            //其他憑證號碼(22,99)
                            payRecord.setValue({
                                fieldId: 'custrecord_10_other_desc',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: other_descID,
                                    line: i
                                })
                            });
                            //公營載具號碼(25)
                            payRecord.setValue({
                                fieldId: 'custrecord_10_public_vehicle',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: public_vehicleID,
                                    line: i
                                })
                            });
                            //海關代徵稅單號碼(28)
                            payRecord.setValue({
                                fieldId: 'custrecord_10_customs_tax_coll',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: tax_collID,
                                    line: i
                                })
                            });
                            //憑證含稅總額
                            payRecord.setValue({
                                fieldId: 'custrecord_10_sales_total_amt',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: "grossamt",
                                    line: i
                                })
                            });
                            //憑證未稅金額
                            payRecord.setValue({
                                fieldId: 'custrecord_10_sales_amt',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: "amount",
                                    line: i
                                })
                            });
                            //憑證稅額
                            payRecord.setValue({
                                fieldId: 'custrecord_10_vat_io',
                                value: nRec.getSublistValue({   
                                    sublistId: trxn_noID,
                                    fieldId: "tax1amt",
                                    line: i
                                })
                            });                    
                                                    
                            //如果是approved 要設定 年 月 gui_confirmed
                            if(IsApproved && (context.type == 'create' || IsEditToApproved)){
                                //2019/07/26 Matt新增 所屬年月改抓POSTING PERIOD欄位
                                var gui_date =nRec.getText('postingperiod');
                                gui_date = gui_date.split(' ');    
                                var nowYear = gui_date[1];
                                var nowMonth = gui_date[0];
                                nowMonth = getMonthformEnglishMonth(nowMonth); 
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_gui_confirmed',
                                    value: true
                                });
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_occured_year',
                                    value: nowYear
                                });
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_occured_month',
                                    value: nowMonth
                                });
                            }
    
                            //如果Creat進項發票 要給予進項發票初始值
                            if(context.type == 'create'){
                                //讀取憑證未稅金額
                                var sales_amt = payRecord.getValue({
                                    fieldId: 'custrecord_10_sales_amt',
                                    }); 
                                //給予[已折讓未稅金額]預設值0                           
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_cm_gui_line_amount',
                                    value: 0
                                });
                                //給予[已折讓稅額]預設值0
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_cm_gui_tax_amount',
                                    value: 0
                                });
                                //給予[已折讓含稅總額]預設值0
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_cm_gui_total_amount',
                                    value: 0
                                });
                                //給予[未折讓金額(未稅)]預設值[憑證未稅金額]
                                payRecord.setValue({
                                    fieldId: 'custrecord_10_undiscount_amt',
                                    value: sales_amt
                                });                      
                            }
                            //進項發票存檔
                            var payID = payRecord.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                            log.debug("payID",payID);
                            markedArr.push(new dataElement(i, payID));                           
                        //}                       
                    }
                    //回寫Expensereport 欄位
                    var expensereportRecord = record.load({
                        type: record.Type.EXPENSE_REPORT, 
                        id: nRec.id,
                        isDynamic: false,
                    });
                    for (var i = 0; i < markedArr.length; i++) {
                        expensereportRecord.setSublistValue({
                            sublistId : trxn_noID,
                            fieldId : 'custcol_gv_pay_id',
                            value : markedArr[i].payID,
                            line: markedArr[i].linenumber
                        });	
    
                        expensereportRecord.setSublistValue({
                            sublistId : trxn_noID,
                            fieldId : 'custcol_gv_pay_no',
                            value : markedArr[i].payID,
                            line: markedArr[i].linenumber
                        });	                        
                    }  	                 

                    expensereportRecord.save();  
                }     
            } catch (error) {                
                log.debug(error.name,error.message);
            }                            
        }
        //如果異動項目 進項發票需要刪除
        if(context.type == 'edit'){            
            var oLineCount = oRec.getLineCount({"sublistId": trxn_noID}); //進項發票資訊的sublist數
            var nLineCount = nRec.getLineCount({"sublistId": trxn_noID}); //進項發票資訊的sublist數
            var checkdelect = true;
            for(var i=0 ; i<oLineCount ; i++){
                var oinvoicesID = oRec.getSublistValue({   
                    sublistId: trxn_noID,
                    fieldId: "custcol_gv_pay_id",
                    line: i
                })
                for(var j=0 ; j<nLineCount ; j++){
                    var ninvoicesID = nRec.getSublistValue({   
                        sublistId: trxn_noID,
                        fieldId: "custcol_gv_pay_id",
                        line: j
                    })

                    if(oinvoicesID == ninvoicesID){
                        checkdelect = false;
                    }
                }
                
                if(checkdelect && oinvoicesID!=""){
                    record.delete({
                        type: "customrecord_ev_pay_invoices_all", 
                        id: oinvoicesID,
                    });
                }
                checkdelect=true;
            }
        }
        //如果刪除Expensereport 進項發票需要刪除
        if(context.type == 'delete'){
            var nLineCount = nRec.getLineCount({"sublistId": trxn_noID}); //進項發票資訊的sublist數
            for(var i=0 ; i<nLineCount ; i++){
                var ninvoicesID = nRec.getSublistValue({   
                    sublistId: trxn_noID,
                    fieldId: "custcol_gv_pay_id",
                    line: i
                })
                if(ninvoicesID!=""){
                    log.debug("刪除進項ID",ninvoicesID);
                    record.delete({
                        type: "customrecord_ev_pay_invoices_all", 
                        id: ninvoicesID,
                    });
                }
            }
        }        

    }
    function disableSublistField(context, sublistName, fieldName)
	{ 
        try {
            var FIELDS_TO_EXCLUDE = ["custbody_v_order_notes"]; 
            if (FIELDS_TO_EXCLUDE.indexOf(fieldName) >= 0){
                return;
            }
        
            //get reference to the form field to disable it.
            var fld = context.form.getSublist(sublistName).getField(fieldName);
            if (fld) {
                fld.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});	      			
            } else
                log.debug("Unable to get reference to field", fieldName);
        } catch (error) {
            //log.debug(error.name,error.message);
        }		
		
    }
    function getMonthformEnglishMonth(englishmonth){
        var month={
            Jan:'1',
            Feb:'2',
            Mar:'3',
            Apr:'4',
            May:'5',
            Jun:'6',
            Jul:'7',
            Aug:'8',
            Sep:'9',
            Oct:'10',
            Nov:'11',
            Dec:'12'
        }
        return month[englishmonth];
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
    function dataElement(linenumber,payID) {
        this.linenumber = linenumber;	
        this.payID = payID;	
	}
    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
});
