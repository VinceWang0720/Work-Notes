/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */
define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log', './commonCustFolderApi'],
function(encode, file, search, format, config, record, email, render, runtime, log, custfolder){
    const periodArr = [
        { "from": 0,   "to": 30 },
		{ "from": 31,  "to": 60 },
		{ "from": 61,  "to": 90 },
		{ "from": 91,  "to": 120 },
		{ "from": 121, "to": 150 },
		{ "from": 151, "to": 180 },
		{ "from": 181, "to": 360 },
		{ "from": 361, "to": 540 },
		{ "from": 541, "to": 720 },
		{ "from": 721, "to": 1080 },
		{ "from": 1081, "to": 9999 }
    ];

    function getInputData(){
        return search.create({
            type: "assemblyitem",
            filters:[
                ["type","anyof","Assembly"],
                "OR",
                ["type","anyof","InvtPart"],
               //  "AND",
               //  ["internalid","anyof",1063]
            ],
      columns:
      [
                search.createColumn({ name: "name", label: "Name" }),
                //search.createColumn({name: "inventorylocation", label: "Inventory Location"})
      ]
        });
    };

    function map(context){
        var obj = JSON.parse(context.value);
        var scriptObj = runtime.getCurrnentScript();
        var pBaseDate = scriptObjScript.getParameter({
            name: 'custscript_xxpr004_v2_base_date'
        });
        var baseDate = format.format({
            value: new Date(pBaseDate),
            type: format.Type.DATE,
            timezone: format.Timezone.ASIA_TAIPEI
        });

        try{
            //#region  Parameter
            var searchObj = getPeriodSearch(obj.id,"onorbefore", baseDate, baseDate,"");
			var in_TTL = 0;
			var in_amount = 0;
			var out_TTL = 0;
			var out_amount = 0;
			var itemid, displayname,program, category1, salesdescription, item_type,sum,amount,departmentID;  //category2, category3,
			var department, PM_name, BUYER_name, brand, location,itemclass, trans_status, createdfrom,createdfromtype,internalid;
			var tranid, trans_type, soInternalid, soTranid, soDate, soQuantity,soAmount, currency, exchangerate, soAmountTWD;
			var onHand = 0;
			var onHandAmount = 0;
			var in_date = "";
			var out_date = "";
			var in_check = true;
			var out_check = true;
			var in_first_amount=0;
			var out_first_amount=0;
			var location_name = [];
			var location_in_TTL = [];
			var location_out_TTL = [];
			var location_onHand = [];
			var PeriodObject = {};
			var Period_flag = false;
            //#endregion

            if(searchObj.runPaged().count > 0 ){
                searchObj.run().each(function(result){
                    itemid = result.getValue({name:'itemid',join:'item',summary:'GROUP'});
                    displayname = result.getValue({name:'displayname',join:'item',summary:'GROUP'});
                    program = result.getValue({name:'custitem_program',join:'item',summary:'GROUP'});
                    category1 = result.getValue({name:'csegitem_category1',join:'item',summary:'GROUP'});
                    salesdescription = result.getValue({name:'salesdescription',join:'item',summary:'GROUP'});
                    item_type = result.getValue({name:'custitem_aic_item_type',join:'item',summary:'GROUP'});
                    trans_type = result.getValue({name:'type',join:'item',summary:'GROUP'});
                    sum = result.getValue({ name: 'quantity', summary: "SUM" });
					amount = result.getValue({ name: 'amount', summary: "SUM" });
					departmentID = result.getValue({ name: "custitemaeb_pm_code",join: "item", summary: "GROUP" });

                    if(department ==""){
                        var employeeRec = search.lookupFields({
							type :record.Type.EMPLOYEE,
							id :  departmentID,
							columns : ['department'] //所屬department
						});
						department = employeeRec['department'];
						department = department[0].text;
                    }

                    PM_name = result.getText({ name: "custitemaeb_pm_code",join: "item", summary: "GROUP" });
					BUYER_name = result.getText({ name: "custitemaeb_buyer_code",join: "item", summary: "GROUP" });
					brand = result.getText({ name: 'custitem_brand', join: "item", summary: "GROUP" });
					location = result.getValue({ name: 'name', join: "location", summary: "GROUP" });
					internalid = result.getValue({ name: 'internalid', join: "location", summary: "GROUP" });

					itemclass = result.getValue({ name: 'name', join: "class", summary: "GROUP" });
					trans_status = result.getText({ name: 'statusref', summary: "GROUP" });
					tranid = result.getValue({ name: 'tranid', summary: "GROUP" });
					createdfromtype = result.getText({ name: "type",join: "createdFrom", summary: "GROUP" });
                    var trandate = result.getValue({name: 'trandate',summary: "GROUP"});
					var tradingdate = result.getValue({name: 'custcol_om_recent_trading_day',summary: "GROUP"});
					location_name[internalid] = location;

                    if(!PeriodObject[obj.id+"_"+internalid]){
						PeriodObject[obj.id+"_"+internalid] = []
					}

                    if((trans_type == "ItemRcpt" && createdfromtype != "Transfer Order") || 
                        (trans_type == "InvAdjst" && Number(sum) > 0) || 
                        (trans_type == "Build" && Number(sum) > 0) || 
                        (trans_type == "Unbuild" && Number(sum) > 0))
					{
					   if(trans_type == "InvAdjst"){
						   trandate = tradingdate;
					   };
					   PeriodObject[obj.id+"_"+internalid].push({
						   'itemid':obj.id,
						   "trandate":trandate,
						   "location":internalid,
						   "tranid":tranid,
						   "sum":sum
					   })
					}
                    if((trans_type == "InvTrnfr"  && Number(sum) > 0) || 
                    (trans_type == "TrnfrOrd" && Number(sum) > 0)){
                        Period_flag = true;
                    }

                    //進貨
                    if( trans_type == "ItemRcpt" || trans_type == "InvAdjst" || trans_type == "InvTrnfr" || trans_type == "Unbuild")
					{
						in_TTL = Number(in_TTL) + Number(sum);
						in_amount = Number(in_amount) + Number(amount);
						location_in_TTL[internalid] = Number(NVL(location_in_TTL[internalid])) + Number(sum);
						log.debug(location,"tranid="+tranid+",trans_type="+trans_type+",trandate="+trandate+",createdfromtype="+createdfromtype+",sum="+sum);
					}
					else //出貨
					{
						if(trans_status=="Shipped" || trans_type=="Build"){
							out_TTL = Number(out_TTL) + Number(sum);
							out_amount = Number(out_amount) + Number(amount);
							location_out_TTL[internalid] = Number(NVL(location_out_TTL[internalid])) + Number(sum);
							log.debug(location,"tranid="+tranid+",trans_type="+trans_type+",trandate="+trandate+",createdfromtype="+createdfromtype+",sum="+sum);
						}
					}

                    onHand = in_TTL + out_TTL;
					onHandAmount = in_amount + out_amount;
					location_onHand[internalid]= NVL(location_in_TTL[internalid]) + NVL(location_out_TTL[internalid]);
					return true;
                });

                var averagecost = onHandAmount/onHand;
                location_name.forEach({function(result,locationIndex){
                    var writePeriod = [];
                    var writePeriod_So = [];
                    periodArr.forEach(function (result, index) {
						writePeriod[index] = 0;
						writePeriod_So[index] = 0;
					});
                    var onHand_temp = location_onHand[locationIndex]; //當on hand都扣完，就不繼續撈

                    if(location_onHand[locationIndex] != 0){
                        periodArr.forEach(function (result, index){
                            if( onHand_temp > 0 ){
                                var from = result['from'];
								var to = result['to'];
                                var newdate = new Date(baseDate);
								var newdate2 = new Date(baseDate);

                                newdate.setDate(newdate.getDate() - from); // minus the date
								newdate2.setDate(newdate2.getDate() - to); // minus the date

                                var baseDate_1 = format.format({
									value: new Date(newdate),
									type: format.Type.DATE,
									timezone: format.Timezone.ASIA_TAIPEI
								});
								var baseDate_2 = format.format({
									value: new Date(newdate2),
									type: format.Type.DATE,
									timezone: format.Timezone.ASIA_TAIPEI
								});

                                var periodObj = getPeriodSearch(obj.id, "within", baseDate_2, baseDate_1,locationIndex);

                                var period_in_TTL = 0;
								var period_out_TTL = 0;
								soInternalid = '';

                                periodObj.run().each(function(result){
                                    itemid = result.getValue({name: 'itemid',join:"item",summary: "GROUP"});
									trans_type = result.getValue({name: 'type',summary: "GROUP"});
									var sum = result.getValue({name: 'quantity',summary: "SUM"});
									var amount = result.getValue({name: 'amount',summary: "SUM"});
									var trans_status = result.getText({name: 'statusref',summary: "GROUP"});
									var trandate = result.getValue({name: 'trandate',summary: "GROUP"});
									tranid = result.getValue({name: 'tranid',summary: "GROUP"});
									createdfrom = result.getValue({name: "tranid",join: "createdFrom",summary: "GROUP"});	//PO Number
									createdfromtype = result.getText({ name: "type",join: "createdFrom", summary: "GROUP" });

                                    //進貨
									if((trans_type == "ItemRcpt" && createdfromtype != "Transfer Order") || 
                                    (trans_type == "InvAdjst" && Number(sum) > 0) || 
                                    (trans_type == "Build" && Number(sum) > 0) || 
                                    (trans_type == "Unbuild" && Number(sum) > 0))
									{
										if(in_check && trans_type == "ItemRcpt"){
											in_date = trandate
											in_first_amount =Number(amount)/Number(sum);
											in_check =false;
										}
										period_in_TTL = Number(period_in_TTL) + Number(sum);
									}
									else
									{
										if(trans_status=="Shipped"){
											if(out_check){
												out_date = trandate
												out_first_amount =Number(amount)/Number(sum);
												out_check =false;
											}
											period_out_TTL = Number(period_out_TTL) + Number(sum);
										}
									}

									return true;
                                });

                                var periodsum = 0;
								if(onHand_temp - period_in_TTL >= 0){
									writePeriod[index] = Number(period_in_TTL);
									periodsum = Number(period_in_TTL);

								}else{
									writePeriod[index] = Number(onHand_temp) ;
									periodsum = Number(onHand_temp);
								}

                                // 收料與開帳資料減掉onHand = 可以讓其他倉庫剩餘onHand扣除
                                for(var d = 0; d < PeriodObject[obj.id+"_"+locationIndex].length; ) {
									if(periodsum > 0){
										if(Number(periodsum) >= Number(PeriodObject[obj.id+"_"+locationIndex][d]["sum"])){
											periodsum = Number(periodsum) - Number(PeriodObject[obj.id+"_"+locationIndex][d]["sum"]);
											PeriodObject[obj.id+"_"+locationIndex].splice(d, 1);
										}else{
											PeriodObject[obj.id+"_"+locationIndex][d]["sum"] = Number(PeriodObject[obj.id+"_"+locationIndex][d]["sum"]) - Number(periodsum);
											periodsum = 0;
										}
									}else{
										d = PeriodObject[obj.id+"_"+locationIndex].length;
									}
								}

                                onHand_temp = onHand_temp - period_in_TTL ;
								writePeriod_So[index] = period_out_TTL*-1;
                            }
                        });

                        //查詢SO單
						soTranid = '';
						soAmount = '';
						soDate = '';
						soQuantity = '';
						currency = '';
						exchangerate = '';
						soAmountTWD = '';
						soRate = '';
						soDepartment = '';
						soSales = '';
						var newdate1 = new Date(baseDate);
						var newdate2 = new Date(baseDate);

                        newdate1.setDate(newdate1.getDate() - 365); // minus the date
						newdate2.setDate(newdate2.getDate()); // minus the date
						var baseDate_1 = format.format({
							value: new Date(newdate1),
							type: format.Type.DATE,
							timezone: format.Timezone.ASIA_TAIPEI
						});
						var baseDate_2 = format.format({
							value: new Date(newdate2),
							type: format.Type.DATE,
							timezone: format.Timezone.ASIA_TAIPEI
						});

                        var SO_Object = getSalesOrder(obj.id,baseDate_1,baseDate_2);
						//log.debug('SO_Object',SO_Object);
						soTranid = SO_Object['tranid'];
						soAmount = SO_Object['amount'];
						soDate = SO_Object['trandate'];
						soQuantity = SO_Object['quantity'];
						currency = SO_Object['currency'];
						exchangerate = SO_Object['exchangerate'];
						soAmountTWD = soAmount * exchangerate;
						soRate = SO_Object['rate'];
						soDepartment = SO_Object['department'];
						soSales = SO_Object['salesrep'];

                        if(Number(onHand_temp) > 0){
                            //log.debug("有調倉",obj.id+"_"+locationIndex)
                            context.write({
                                key: obj.id,
								value: {
									'itemid' : itemid,
									'displayname': displayname,
									'program': program,
									'category1': category1,
									'salesdescription': salesdescription,
									'item_type' : item_type,
									'currentSold': writePeriod_So[0], //currentSold,current_out_TTL
									'ttlQTY': location_onHand[locationIndex], //存貨數量
									'ttlAMT': Number(location_onHand[locationIndex]) * averagecost, //ttlAMT,
									'onHand_temp':Number(onHand_temp),
									'averagecost':averagecost,
									'_0_30' : writePeriod[0],
									'_31_60' : writePeriod[1],
									'_61_90' : writePeriod[2],
									'_91_120' : writePeriod[3],
									'_121_150' : writePeriod[4],
									'_151_180' : writePeriod[5],
									'_181_360' : writePeriod[6],
									'_361_540' : writePeriod[7],
									'_541_720' : writePeriod[8],
									'_721_1080' : writePeriod[9],
									'_1081_9999' : writePeriod[10],
									'_0_30_COST' : Number(writePeriod[0]) * averagecost,
									'_31_60_COST' : Number(writePeriod[1]) * averagecost,
									'_61_90_COST' : Number(writePeriod[2]) * averagecost,
									'_91_120_COST' : Number(writePeriod[3]) * averagecost,
									'_121_150_COST' : Number(writePeriod[4]) * averagecost,
									'_151_180_COST' : Number(writePeriod[5]) * averagecost,
									'_181_360_COST' : Number(writePeriod[6]) * averagecost,
									'_361_540_COST' : Number(writePeriod[7]) * averagecost,
									'_541_720_COST' : Number(writePeriod[8]) * averagecost,
									'_721_1080_COST' : Number(writePeriod[9]) * averagecost,
									'_1081_9999_COST' : Number(writePeriod[10]) * averagecost,
									'department' : department,
									'PM_name' : PM_name,
									'BUYER_name' : BUYER_name,
									'brand' : brand,
									'location' : location_name[locationIndex],
									'location_index' : locationIndex,
									'itemclass':itemclass,
									'in_date' : in_date,
									'in_amount' : in_first_amount,
									'out_date' : out_date,
									'out_amount' : out_first_amount,
									'so_qty':out_TTL*-1,
									'soTranid': soTranid,
									'soDate': soDate,
									'soQuantity': soQuantity,
									'soAmount': soAmount,
									'currency': currency,
									'soAmountTWD': soAmountTWD,
									'soRate': soRate,
									'soDepartment': soDepartment,
									'soSales': soSales
                                }
                            });
                        }else{
                            //log.debug("無調倉",obj.id+"_"+locationIndex)
                            context.write({
								key: obj.id+"_"+locationIndex,
								value: {
									'itemid' : itemid,
									'displayname': displayname,
									'program': program,
									'category1': category1,
									'salesdescription': salesdescription,
									'item_type' : item_type,
									'currentSold': writePeriod_So[0], //currentSold,current_out_TTL
									'ttlQTY': location_onHand[locationIndex], //存貨數量
									'ttlAMT': Number(location_onHand[locationIndex]) * averagecost, //ttlAMT,
									'onHand_temp':Number(onHand_temp),
									'averagecost':averagecost,
									'_0_30' : writePeriod[0],
									'_31_60' : writePeriod[1],
									'_61_90' : writePeriod[2],
									'_91_120' : writePeriod[3],
									'_121_150' : writePeriod[4],
									'_151_180' : writePeriod[5],
									'_181_360' : writePeriod[6],
									'_361_540' : writePeriod[7],
									'_541_720' : writePeriod[8],
									'_721_1080' : writePeriod[9],
									'_1081_9999' : writePeriod[10],
									'_0_30_COST' : Number(writePeriod[0]) * averagecost,
									'_31_60_COST' : Number(writePeriod[1]) * averagecost,
									'_61_90_COST' : Number(writePeriod[2]) * averagecost,
									'_91_120_COST' : Number(writePeriod[3]) * averagecost,
									'_121_150_COST' : Number(writePeriod[4]) * averagecost,
									'_151_180_COST' : Number(writePeriod[5]) * averagecost,
									'_181_360_COST' : Number(writePeriod[6]) * averagecost,
									'_361_540_COST' : Number(writePeriod[7]) * averagecost,
									'_541_720_COST' : Number(writePeriod[8]) * averagecost,
									'_721_1080_COST' : Number(writePeriod[9]) * averagecost,
									'_1081_9999_COST' : Number(writePeriod[10]) * averagecost,
									'department' : department,
									'PM_name' : PM_name,
									'BUYER_name' : BUYER_name,
									'brand' : brand,
									'location' : location_name[locationIndex],
									'location_index' : locationIndex,
									'itemclass':itemclass,
									'in_date' : in_date,
									'in_amount' : in_first_amount,
									'out_date' : out_date,
									'out_amount' : out_first_amount,
									'so_qty':out_TTL*-1,
									'soTranid': soTranid,
									'soDate': soDate,
									'soQuantity': soQuantity,
									'soAmount': soAmount,
									'currency': currency,
									'soAmountTWD': soAmountTWD,
									'soRate': soRate,
									'soDepartment': soDepartment,
									'soSales': soSales,
								}
							});
                        }
                    }
                }});

                // log.debug("PeriodObject",PeriodObject);
                if(Period_flag){
                    context.write({
                        key: obj.id,
                        value: {
                            'PeriodObject':PeriodObject
                        }
                    });
                }
            }
        }
        catch(e)
        {
            log.debug("error",e.message);
        };
    };

    function reduce(context){
        var scriptObj = runtime.getCurrentScript();
        var p_base_date = scriptObj.getParameter({name: 'custscript_xxpr004_v2_base_date'});
        //var p_base_date = '2022/06/29';
        var baseDate = format.format({
            value: new Date(p_base_date),
            type: format.Type.DATE,
            timezone: format.Timezone.ASIA_TAIPEI
        });
        
        if(context.values.length == 1){
            context.write({
                key: context.key,
                value: JSON.parse(context.values[0])
            });
        }else{
            var Period = "";
			var PeriodObject = "";
			for(var i = 0 ; i < context.values.length; i++){
				if(JSON.parse(context.values[i]).PeriodObject){
					PeriodObject = JSON.parse(context.values[i]).PeriodObject;
				}
            }

            log.debug("PeriodObject",PeriodObject);
            
        }

    };

    function summarize(){};

    //#region Function
    function getPeriodSearch(itemid,type, fromDate, toDate,locationid){};

    function runExcel(context, base_date){};

    function NVL(n){};

    function isFloat (n){};
    //#endregion

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});