/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */
define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log', './commonCustFolderApi'],
	function (encode, file, search, format, config, record, email, render, runtime, log, custfolder) {
		const PERIOD_ARR = [
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

		function getInputData() {
            log.debug("getInputData");
			return search.create({
				type: "assemblyitem",
				filters: [
					["type", "anyof", "Assembly"],
					"OR",
					["type", "anyof", "InvtPart"],
					"AND",
					["internalid","anyof",1556]
				],
				columns:
					[
						search.createColumn({ name: "name", label: "Name" }),
						//search.createColumn({name: "inventorylocation", label: "Inventory Location"})
					]
			});
		}

		function map(context) {
            try {
                log.debug("map");
                var obj = JSON.parse(context.value);
                //log.debug("obj",obj);
                var scriptObj = runtime.getCurrentScript();
                //log.debug("scriptObj",scriptObj);
                var pBaseDate = scriptObj.getParameter({
                    name: 'custscript_xxpr004_v2_base_date'
                });
                //log.debug("pBaseDate",pBaseDate);
                var baseDate = format.format({
                    value: new Date(pBaseDate),
                    type: format.Type.DATE,
                    timezone: format.Timezone.ASIA_TAIPEI
                });
				//#region  Parameter
				var searchObj = getPeriodSearch(obj.id, "onorbefore", baseDate, baseDate, "");
				var in_TTL = 0;
				var in_amount = 0;
				var out_TTL = 0;
				var out_amount = 0;
				var itemid, displayname, program, category1, salesdescription, item_type, sum, amount, departmentID;  //category2, category3,
				var department, PM_name, BUYER_name, brand, location, itemclass, trans_status, createdfrom, createdfromtype, internalid;
				var tranid, trans_type, soInternalid, soTranid, soDate, soQuantity, soAmount, currency, exchangerate, soAmountTWD;
				var onHand = 0;
				var onHandAmount = 0;
				var in_date = "";
				var out_date = "";
				var in_check = true;
				var out_check = true;
				var in_first_amount = 0;
				var out_first_amount = 0;
				var location_name = [];
				var location_in_TTL = [];
				var location_out_TTL = [];
				var location_onHand = [];
				var PeriodObject = {};
				var Period_flag = false;
				//#endregion

                //log.debug("searchObj.runPaged().count",searchObj.runPaged().count);
				if (searchObj.runPaged().count > 0) {
					searchObj.run().each(function (result) {
						itemid = result.getValue({ name: 'itemid', join: 'item', summary: 'GROUP' });
						displayname = result.getValue({ name: 'displayname', join: 'item', summary: 'GROUP' });
						program = result.getValue({ name: 'custitem_program', join: 'item', summary: 'GROUP' });
						category1 = result.getValue({ name: 'csegitem_category1', join: 'item', summary: 'GROUP' });
						salesdescription = result.getValue({ name: 'salesdescription', join: 'item', summary: 'GROUP' });
						//item_type = result.getValue({ name: 'custitem_aic_item_type', join: 'item', summary: 'GROUP' });
						trans_type = result.getValue({ name: 'type', join: 'item', summary: 'GROUP' });
						sum = result.getValue({ name: 'quantity', summary: "SUM" });
						amount = result.getValue({ name: 'amount', summary: "SUM" });
						departmentID = result.getValue({ name: "custitemaeb_pm_code", join: "item", summary: "GROUP" });

						if (department == "") {
							var employeeRec = search.lookupFields({
								type: record.Type.EMPLOYEE,
								id: departmentID,
								columns: ['department'] //所屬department
							});
							department = employeeRec['department'];
							department = department[0].text;
						}

						PM_name = result.getText({ name: "custitemaeb_pm_code", join: "item", summary: "GROUP" });
						BUYER_name = result.getText({ name: "custitemaeb_buyer_code", join: "item", summary: "GROUP" });
						brand = result.getText({ name: 'custitem_brand', join: "item", summary: "GROUP" });
						location = result.getValue({ name: 'name', join: "location", summary: "GROUP" });
						internalid = result.getValue({ name: 'internalid', join: "location", summary: "GROUP" });

						itemclass = result.getValue({ name: 'name', join: "class", summary: "GROUP" });
						trans_status = result.getText({ name: 'statusref', summary: "GROUP" });
						tranid = result.getValue({ name: 'tranid', summary: "GROUP" });
						createdfromtype = result.getText({ name: "type", join: "createdFrom", summary: "GROUP" });
						//var trandate = result.getValue({ name: 'trandate', summary: "GROUP" });
						//log.debug("trandate",trandate);
						var tradingdate = result.getValue({ name: 'custcol_om_recent_trading_day', summary: "GROUP" });
						//log.debug("tradingdate",tradingdate);
						location_name[internalid] = location;

						if (!PeriodObject[obj.id + "_" + internalid]) {
							PeriodObject[obj.id + "_" + internalid] = []
						}

						if ((trans_type == "ItemRcpt" && createdfromtype != "Transfer Order") ||
							(trans_type == "InvAdjst" && Number(sum) > 0) ||
							(trans_type == "Build" && Number(sum) > 0) ||
							(trans_type == "Unbuild" && Number(sum) > 0)) {
							if (trans_type == "InvAdjst") {
								trandate = tradingdate;
							};
							PeriodObject[obj.id + "_" + internalid].push({
								'itemid': obj.id,
								"trandate": trandate,
								"location": internalid,
								"tranid": tranid,
								"sum": sum
							})
						}
						if ((trans_type == "InvTrnfr" && Number(sum) > 0) ||
							(trans_type == "TrnfrOrd" && Number(sum) > 0)) {
							Period_flag = true;
						}

						//進貨
						if (trans_type == "ItemRcpt" || trans_type == "InvAdjst" || trans_type == "InvTrnfr" || trans_type == "Unbuild") {
							in_TTL = Number(in_TTL) + Number(sum);
							in_amount = Number(in_amount) + Number(amount);
							location_in_TTL[internalid] = Number(NVL(location_in_TTL[internalid])) + Number(sum);
							log.debug(location, "tranid=" + tranid + ",trans_type=" + trans_type + ",trandate=" + trandate + ",createdfromtype=" + createdfromtype + ",sum=" + sum);
						}
						else //出貨
						{
							if (trans_status == "Shipped" || trans_type == "Build") {
								out_TTL = Number(out_TTL) + Number(sum);
								out_amount = Number(out_amount) + Number(amount);
								location_out_TTL[internalid] = Number(NVL(location_out_TTL[internalid])) + Number(sum);
								log.debug(location, "tranid=" + tranid + ",trans_type=" + trans_type + ",trandate=" + trandate + ",createdfromtype=" + createdfromtype + ",sum=" + sum);
							}
						}

						onHand = in_TTL + out_TTL;
						onHandAmount = in_amount + out_amount;
						location_onHand[internalid] = NVL(location_in_TTL[internalid]) + NVL(location_out_TTL[internalid]);
						return true;
					});

                    //log.debug("run searchObj the end");

					var averagecost = onHandAmount / onHand;
					location_name.forEach(
						function(result, locationIndex) {
							var writePeriod = [];
							var writePeriod_So = [];
							PERIOD_ARR.forEach(function (result, index) {
								writePeriod[index] = 0;
								writePeriod_So[index] = 0;
							});
							var onHand_temp = location_onHand[locationIndex]; //當on hand都扣完，就不繼續撈

							if (location_onHand[locationIndex] != 0) {
								PERIOD_ARR.forEach(function (result, index) {
									if (onHand_temp > 0) {
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

										var periodObj = getPeriodSearch(obj.id, "within", baseDate_2, baseDate_1, locationIndex);

										var period_in_TTL = 0;
										var period_out_TTL = 0;
										soInternalid = '';

										periodObj.run().each(function (result) {
											itemid = result.getValue({ name: 'itemid', join: "item", summary: "GROUP" });
											trans_type = result.getValue({ name: 'type', summary: "GROUP" });
											var sum = result.getValue({ name: 'quantity', summary: "SUM" });
											var amount = result.getValue({ name: 'amount', summary: "SUM" });
											var trans_status = result.getText({ name: 'statusref', summary: "GROUP" });
											var trandate = result.getValue({ name: 'trandate', summary: "GROUP" });
											tranid = result.getValue({ name: 'tranid', summary: "GROUP" });
											createdfrom = result.getValue({ name: "tranid", join: "createdFrom", summary: "GROUP" });	//PO Number
											createdfromtype = result.getText({ name: "type", join: "createdFrom", summary: "GROUP" });

											//進貨
											if ((trans_type == "ItemRcpt" && createdfromtype != "Transfer Order") ||
												(trans_type == "InvAdjst" && Number(sum) > 0) ||
												(trans_type == "Build" && Number(sum) > 0) ||
												(trans_type == "Unbuild" && Number(sum) > 0)) {
												if (in_check && trans_type == "ItemRcpt") {
													in_date = trandate
													in_first_amount = Number(amount) / Number(sum);
													in_check = false;
												}
												period_in_TTL = Number(period_in_TTL) + Number(sum);
											}
											else {
												if (trans_status == "Shipped") {
													if (out_check) {
														out_date = trandate
														out_first_amount = Number(amount) / Number(sum);
														out_check = false;
													}
													period_out_TTL = Number(period_out_TTL) + Number(sum);
												}
											}

											return true;
										});

										var periodsum = 0;
										if (onHand_temp - period_in_TTL >= 0) {
											writePeriod[index] = Number(period_in_TTL);
											periodsum = Number(period_in_TTL);

										} else {
											writePeriod[index] = Number(onHand_temp);
											periodsum = Number(onHand_temp);
										}

										// 收料與開帳資料減掉onHand = 可以讓其他倉庫剩餘onHand扣除
										for (var d = 0; d < PeriodObject[obj.id + "_" + locationIndex].length;) {
											if (periodsum > 0) {
												if (Number(periodsum) >= Number(PeriodObject[obj.id + "_" + locationIndex][d]["sum"])) {
													periodsum = Number(periodsum) - Number(PeriodObject[obj.id + "_" + locationIndex][d]["sum"]);
													PeriodObject[obj.id + "_" + locationIndex].splice(d, 1);
												} else {
													PeriodObject[obj.id + "_" + locationIndex][d]["sum"] = Number(PeriodObject[obj.id + "_" + locationIndex][d]["sum"]) - Number(periodsum);
													periodsum = 0;
												}
											} else {
												d = PeriodObject[obj.id + "_" + locationIndex].length;
											}
										}

										onHand_temp = onHand_temp - period_in_TTL;
										writePeriod_So[index] = period_out_TTL * -1;
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

								var SO_Object = getSalesOrder(obj.id, baseDate_1, baseDate_2);
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

								if (Number(onHand_temp) > 0) {
									//log.debug("有調倉",obj.id+"_"+locationIndex)
									context.write({
										key: obj.id,
										value: {
											'itemid': itemid,
											'displayname': displayname,
											'program': program,
											'category1': category1,
											'salesdescription': salesdescription,
											'item_type': item_type,
											'currentSold': writePeriod_So[0], //currentSold,current_out_TTL
											'ttlQTY': location_onHand[locationIndex], //存貨數量
											'ttlAMT': Number(location_onHand[locationIndex]) * averagecost, //ttlAMT,
											'onHand_temp': Number(onHand_temp),
											'averagecost': averagecost,
											'_0_30': writePeriod[0],
											'_31_60': writePeriod[1],
											'_61_90': writePeriod[2],
											'_91_120': writePeriod[3],
											'_121_150': writePeriod[4],
											'_151_180': writePeriod[5],
											'_181_360': writePeriod[6],
											'_361_540': writePeriod[7],
											'_541_720': writePeriod[8],
											'_721_1080': writePeriod[9],
											'_1081_9999': writePeriod[10],
											'_0_30_COST': Number(writePeriod[0]) * averagecost,
											'_31_60_COST': Number(writePeriod[1]) * averagecost,
											'_61_90_COST': Number(writePeriod[2]) * averagecost,
											'_91_120_COST': Number(writePeriod[3]) * averagecost,
											'_121_150_COST': Number(writePeriod[4]) * averagecost,
											'_151_180_COST': Number(writePeriod[5]) * averagecost,
											'_181_360_COST': Number(writePeriod[6]) * averagecost,
											'_361_540_COST': Number(writePeriod[7]) * averagecost,
											'_541_720_COST': Number(writePeriod[8]) * averagecost,
											'_721_1080_COST': Number(writePeriod[9]) * averagecost,
											'_1081_9999_COST': Number(writePeriod[10]) * averagecost,
											'department': department,
											'PM_name': PM_name,
											'BUYER_name': BUYER_name,
											'brand': brand,
											'location': location_name[locationIndex],
											'location_index': locationIndex,
											'itemclass': itemclass,
											'in_date': in_date,
											'in_amount': in_first_amount,
											'out_date': out_date,
											'out_amount': out_first_amount,
											'so_qty': out_TTL * -1,
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
								} else {
									//log.debug("無調倉",obj.id+"_"+locationIndex)
									context.write({
										key: obj.id + "_" + locationIndex,
										value: {
											'itemid': itemid,
											'displayname': displayname,
											'program': program,
											'category1': category1,
											'salesdescription': salesdescription,
											'item_type': item_type,
											'currentSold': writePeriod_So[0], //currentSold,current_out_TTL
											'ttlQTY': location_onHand[locationIndex], //存貨數量
											'ttlAMT': Number(location_onHand[locationIndex]) * averagecost, //ttlAMT,
											'onHand_temp': Number(onHand_temp),
											'averagecost': averagecost,
											'_0_30': writePeriod[0],
											'_31_60': writePeriod[1],
											'_61_90': writePeriod[2],
											'_91_120': writePeriod[3],
											'_121_150': writePeriod[4],
											'_151_180': writePeriod[5],
											'_181_360': writePeriod[6],
											'_361_540': writePeriod[7],
											'_541_720': writePeriod[8],
											'_721_1080': writePeriod[9],
											'_1081_9999': writePeriod[10],
											'_0_30_COST': Number(writePeriod[0]) * averagecost,
											'_31_60_COST': Number(writePeriod[1]) * averagecost,
											'_61_90_COST': Number(writePeriod[2]) * averagecost,
											'_91_120_COST': Number(writePeriod[3]) * averagecost,
											'_121_150_COST': Number(writePeriod[4]) * averagecost,
											'_151_180_COST': Number(writePeriod[5]) * averagecost,
											'_181_360_COST': Number(writePeriod[6]) * averagecost,
											'_361_540_COST': Number(writePeriod[7]) * averagecost,
											'_541_720_COST': Number(writePeriod[8]) * averagecost,
											'_721_1080_COST': Number(writePeriod[9]) * averagecost,
											'_1081_9999_COST': Number(writePeriod[10]) * averagecost,
											'department': department,
											'PM_name': PM_name,
											'BUYER_name': BUYER_name,
											'brand': brand,
											'location': location_name[locationIndex],
											'location_index': locationIndex,
											'itemclass': itemclass,
											'in_date': in_date,
											'in_amount': in_first_amount,
											'out_date': out_date,
											'out_amount': out_first_amount,
											'so_qty': out_TTL * -1,
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
						
					});
                    //log.debug("run location_name the end");
					//log.debug("Period_flag",Period_flag);
					if (Period_flag) {
						context.write({
							key: obj.id,
							value: {
								'PeriodObject': PeriodObject
							}
						});
					}
				}
			}
			catch (e) {
				log.debug("map error", e.message);
			}
		}

		function reduce(context) {
            try{
                log.debug("reduce");
                var scriptObj = runtime.getCurrentScript();
                var p_base_date = scriptObj.getParameter({ name: 'custscript_xxpr004_v2_base_date' });
                //var p_base_date = '2022/06/29';
                var baseDate = format.format({
                    value: new Date(p_base_date),
                    type: format.Type.DATE,
                    timezone: format.Timezone.ASIA_TAIPEI
                });

                if (context.values.length == 1) {
                    context.write({
                        key: context.key,
                        value: JSON.parse(context.values[0])
                    });
                } else {
                    var Period = "";
                    var PeriodObject = "";
                    for (var i = 0; i < context.values.length; i++) {
                        if (JSON.parse(context.values[i]).PeriodObject) {
                            PeriodObject = JSON.parse(context.values[i]).PeriodObject;
                        }
                    }

                    log.debug("PeriodObject", PeriodObject);
                    //計算資料
                    for(var i = 0 ; i < context.values.length; i++){
                        var obj = JSON.parse(context.values[i]);
                        if(!obj.PeriodObject){
                            log.debug("obj",obj);
                            Period = obj;
                            for (var per in PeriodObject) {
                            if (PeriodObject.hasOwnProperty(per)) {
                                if(PeriodObject[per].length > 0 && Number(Period["onHand_temp"]) > 0){
                                    log.debug("尋找其他倉"+per,PeriodObject[per]);
                                    for(var l = 0 ; l < PeriodObject[per].length; l++){
                                        var PeriodDate = new Date(PeriodObject[per][l]["trandate"]);
                                        if(Number(Period["onHand_temp"]) >= Number(PeriodObject[per][l]["sum"])){
                                            PERIOD_ARR.forEach(function (result, index) {
                                                var from = result['from'];
                                                var to = result['to'];
        
                                                var newdate = new Date(baseDate);
                                                var newdate2 = new Date(baseDate);
        
                                                newdate.setDate(newdate.getDate() - from); // minus the date
                                                newdate2.setDate(newdate2.getDate() - to); // minus the date
        
                                                if(PeriodDate<=newdate && PeriodDate>= newdate2){
                                                    Period["_"+from+"_"+to] = Number(Period["_"+from+"_"+to])+ Number(PeriodObject[per][l]["sum"]);
                                                    Period["_"+from+"_"+to+"_COST"] = Number(Period["_"+from+"_"+to]) * Number(Period["averagecost"]);
                                                    Period["onHand_temp"] = Number(Period["onHand_temp"]) - Number(PeriodObject[per][l]["sum"]);
                                                    PeriodObject[per][l]["sum"] = 0;
                                                }
                                            });
                                        }else{
                                            PERIOD_ARR.forEach(function (result, index) {
                                                var from = result['from'];
                                                var to = result['to'];
        
                                                var newdate = new Date(baseDate);
                                                var newdate2 = new Date(baseDate);
        
                                                newdate.setDate(newdate.getDate() - from); // minus the date
                                                newdate2.setDate(newdate2.getDate() - to); // minus the date
        
                                                if(PeriodDate<=newdate && PeriodDate>= newdate2){
                                                    Period["_"+from+"_"+to] = Number(Period["_"+from+"_"+to])+ Number(Period["onHand_temp"]);
                                                    Period["_"+from+"_"+to+"_COST"] = Number(Period["_"+from+"_"+to]) * Number(Period["averagecost"]);
                                                    PeriodObject[per][l]["sum"] = Number(PeriodObject[per][l]["sum"]) - Number(Period["onHand_temp"]);
                                                    Period["onHand_temp"] = 0;
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        //  log.debug("調整完PeriodObject",PeriodObject);
                        //  log.debug("調整完Period",Period);
                        // 重新整理
                        var onHand_temp = Period.ttlQTY;
                        PERIOD_ARR.forEach(function (result, index) {
                            var from = result['from'];
                            var to = result['to'];
        
                            //log.debug("onHand_temp",onHand_temp);
                            if(Number(onHand_temp) > 0){
                                //log.debug("_"+from+"_"+to,Number(Period["_"+from+"_"+to]));
                                if(Number(onHand_temp) - Number(Period["_"+from+"_"+to]) >= 0){
                                    onHand_temp = Number(onHand_temp) - Number(Period["_"+from+"_"+to]);
                                }else{
                                    Period["_"+from+"_"+to] = Number(onHand_temp);
                                    Period["_"+from+"_"+to+"_COST"] = Number(onHand_temp) * Number(Period["averagecost"]);
                                    onHand_temp = 0;
                                }
                            }else{
                                Period["_"+from+"_"+to] = 0;
                                Period["_"+from+"_"+to+"_COST"] = 0;
                            }
                        });
                        context.write({
                            key: context.key+"_"+Period["location_index"],
                            value: Period
                        });
                        }
                }
                }
            }catch(e){
                log.debug("reduce error", e.message);
            }
		}

		function summarize(context) {
            try{
                log.debug("summarize");
                var scriptObj = runtime.getCurrentScript();
                var p_base_date = scriptObj.getParameter({ name: 'custscript_xxpr004_v2_base_date' });
                var tw = format.format({
                    value: new Date(p_base_date),  //date,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.ASIA_TAIPEI
                });
                tw = new Date(tw);
                var year = tw.getFullYear();
                var month = tw.getMonth() + 1;
                var day = tw.getDate();

                var base_date = month + '/' + day + '/' + year;

                log.debug("run runExcel");
                runExcel(context, base_date);
            }catch(e){
                log.debug("summarize error", e.message);
            }
		}

		//#region Function
		function getPeriodSearch(itemid, type, fromDate, toDate, locationid) {
            var filters = [
                ["type","anyof","InvAdjst","ItemShip","ItemRcpt","InvTrnfr","TrnfrOrd","Unbuild", "Build"],
                "AND",["shipping","is","F"],
               //  "AND",["mainline","is","F"],
                "AND",["taxline","is","F"],
                "AND",["account.type","anyof","OthCurrAsset"],
                "AND",["formuladate: CASE WHEN {type}='Inventory Adjustment' THEN {custcol_om_recent_trading_day} ELSE {trandate} END","within",fromDate,toDate],
                "AND",["item.internalid","anyof",itemid],
        "AND",["location","anyof",locationid]
            ];

            if( type == "onorbefore" )
            {
                filters = [
                    ["type","anyof","InvAdjst","ItemShip","ItemRcpt","InvTrnfr","TrnfrOrd","Unbuild", "Build"],
                    "AND",["shipping","is","F"],
                   //  "AND",["mainline","is","F"],
                    "AND",["taxline","is","F"],
                    "AND",["account.type","anyof","OthCurrAsset"],
                    "AND",["formuladate: CASE WHEN {type}='Inventory Adjustment' THEN {custcol_om_recent_trading_day} ELSE {trandate} END","onorbefore",fromDate,fromDate],
                    "AND",["item.internalid","anyof",itemid]
                ];
                //暫時  需要調整
                if(locationid !=""){
                    filters = [
                        ["type","anyof","InvAdjst","ItemShip","ItemRcpt","InvTrnfr","TrnfrOrd","Unbuild", "Build"],
                        "AND",["shipping","is","F"],
                       //  "AND",["mainline","is","F"],
                        "AND",["taxline","is","F"],
                        "AND",["account.type","anyof","OthCurrAsset"],
                        "AND",["formuladate: CASE WHEN {type}='Inventory Adjustment' THEN {custcol_om_recent_trading_day} ELSE {trandate} END","onorbefore",fromDate,fromDate],
                        "AND",["item.internalid","anyof",itemid],
                        "AND",["location","anyof",locationid]
                    ];
                }
            }

        var inventoryitemSearchObj = search.create({
            type: "transaction",
            filters: filters,
            columns:
            [
                 search.createColumn({name: "itemid",join: "item", summary: "GROUP",label: "Name"}),
                 search.createColumn({name: "displayname",join: "item", summary: "GROUP",label: "Display Name"}),
                 search.createColumn({name: "salesdescription",join: "item", summary: "GROUP",label: "Description"}),
                 search.createColumn({name: "type",join: "item", summary: "GROUP",label: "Type"}),
                 search.createColumn({name: "custitem_program",join: "item", summary: "GROUP",label: "Item program"}),
                 search.createColumn({name: "csegitem_category1",join: "item", summary: "GROUP",label: "Item Category1"}),
                 //search.createColumn({name: "csegitem_category2",join: "item", summary: "GROUP",label: "Item Category2"}),
                 //search.createColumn({name: "csegitem_category3",join: "item", summary: "GROUP",label: "Item Category3"}),
                 search.createColumn({name: "department",join: "item", summary: "GROUP", label: "Department"}),
                 search.createColumn({name: "custitemaeb_pm_code",join: "item", summary: "GROUP", label: "PM Code"}),
                 search.createColumn({name: "custitemaeb_buyer_code",join: "item", summary: "GROUP", label: "Buyer Code"}),
                 search.createColumn({name: "custitem_brand",join: "item", summary: "GROUP",label: "品牌"}),
                //search.createColumn({name: "custitem_aic_item_type",join: "item", summary: "GROUP", label: "G_Item Type"}),
                 search.createColumn({name: "name",join: "location", summary: "GROUP",label: "name"}),
                 search.createColumn({name: "internalid",join: "location", summary: "GROUP",label: "internalid"}),
                 search.createColumn({name: "name",join: "class", summary: "GROUP",label: "name"}),
                 search.createColumn({name: "trandate", summary: "GROUP",sort: search.Sort.DESC, label: "Date"}),
                 search.createColumn({name: "custcol_om_recent_trading_day", summary: "GROUP",sort: search.Sort.DESC, label: "Trading Date"}),
                 search.createColumn({name: "type", summary: "GROUP", label: "Type"}),
                 search.createColumn({name: "quantity", summary: "SUM", label: "Quantity"}),
                 search.createColumn({name: "amount", summary: "SUM", label: "Amount"}),
                 search.createColumn({name: "statusref", summary: "GROUP", label: "Status"}),
                 search.createColumn({name: "tranid", summary: "GROUP", label: "Document Number"}),
                 search.createColumn({name: "tranid",join: "createdFrom",summary: "GROUP",label: "Document Number"}),
                 search.createColumn({name: "type",join: "createdFrom", summary: "GROUP",label: "Type"}),
            ]
        });

        return inventoryitemSearchObj;
        }

		function runExcel(context, base_date) {
            try{
			var userObj = runtime.getCurrentUser();
            log.debug("userObj",userObj);
			//Style
			var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
			xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
			xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
			xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
			xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
			xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
			xmlString += '<Styles>';
			xmlString += '<Style ss:ID="number1">';
			xmlString += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>';
			xmlString += '<NumberFormat ss:Format="#,##0_);[Red]\(#,##0\)"/>';
			xmlString += '</Style>';
			xmlString += '<Style ss:ID="number2">';
			xmlString += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>';
			xmlString += '<NumberFormat ss:Format="#,##0.000_);[Red]\(#,##0.000\)"/>';
			xmlString += '</Style>';
			xmlString += '</Styles>';
			xmlString += '<Worksheet ss:Name="Sheet1">';
			xmlString += '<Table>';

			//填入橫向標頭欄位
			xmlString += '<Row>' +
				'<Cell><Data ss:Type="String">基準日:</Data></Cell>' +
				'<Cell><Data ss:Type="String">' + base_date + '</Data></Cell>' +
				'</Row>';
			xmlString += '<Row>' +
				'<Cell><Data ss:Type="String">製表人:</Data></Cell>' +
				'<Cell><Data ss:Type="String">' + userObj.name + '</Data></Cell>' +
				'</Row>';
			xmlString += '<Row>' +
				'<Cell><Data ss:Type="String">LEGAL_ENTITY</Data></Cell>' +
				'<Cell><Data ss:Type="String">WH</Data></Cell>' +
				'<Cell><Data ss:Type="String">PART_NUMBER</Data></Cell>' +
				'<Cell><Data ss:Type="String">STOCK_ADJ_TYPE</Data></Cell>' +
				'<Cell><Data ss:Type="String">STOCK_ADJ_TX_TYPE</Data></Cell>' +
				'<Cell><Data ss:Type="String">RESPONSIBLE_PARTY</Data></Cell>' +
				'<Cell><Data ss:Type="String">QTY</Data></Cell>' +
				'<Cell><Data ss:Type="String">COMMENTS</Data></Cell>' +
				'<Cell><Data ss:Type="String">AGING_NUMBER</Data></Cell>' +
				'</Row>';

                log.debug("xmlString",xmlString);
                log.debug("---------------------------");

                log.debug("context",context);
                log.debug("context output",context.output);

            context.output.iterator().each(function (key, value){

                log.debug(key,value);
         
                var details = JSON.parse(value);
                log.debug("details", details);
                log.debug("details.ttlQTY", details.ttlQTY);
                if(details.ttlQTY > 0 ){
                xmlString = writeXml(details, xmlString);
                }
                      return true;
              });

			xmlString += '</Table></Worksheet></Workbook>';

			var base64EncodedString = encode.convert({
				string: xmlString,
				inputEncoding: encode.Encoding.UTF_8,
				outputEncoding: encode.Encoding.BASE_64
			});

			var folderId = custfolder.getUserFolder(runtime.getCurrentUser().name, '客製報表');
			var xlsFile = file.create({ name: '庫齡.xls', fileType: 'EXCEL', contents: base64EncodedString, folder: folderId });
			xlsFile.save();
        }catch(e){
            log.debug("runExcel error",e.message);
        }
		}

		function writeXml(detail, xmlString) {
            try{
            log.debug("writeXml detail", detail);
			var averagecost = Number(NVL(detail.ttlAMT / detail.ttlQTY));
			var p1 = Number(detail._0_30);
			var p2 = Number(detail._31_60);
			var p3 = Number(detail._61_90);
			var p4 = Number(detail._91_120);
			var p5 = Number(detail._121_150);
			var p6 = Number(detail._151_180);
			var p7 = Number(detail._181_360);
			var p9 = Number(detail._361_540);
			var p10 = Number(detail._541_720);
			var p11 = Number(detail._721_1080);
			var p12 = Number(detail._1081_9999);

			var p1_cost = Number(detail._0_30_COST);
			var p2_cost = Number(detail._31_60_COST);
			var p3_cost = Number(detail._61_90_COST);
			var p4_cost = Number(detail._91_120_COST);
			var p5_cost = Number(detail._121_150_COST);
			var p6_cost = Number(detail._151_180_COST);
			var p7_cost = Number(detail._181_360_COST);
			var p9_cost = Number(detail._361_540_COST);
			var p10_cost = Number(detail._541_720_COST);
			var p11_cost = Number(detail._721_1080_COST);
			var p12_cost = Number(detail._1081_9999_COST);

			var in_amount = Number(detail.in_amount);
			var out_amount = Number(detail.out_amount);
			var so_qty = Number(detail.so_qty);

			xmlString += '<Row>' +
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' +
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' +
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' +
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' +
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' +
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' +
			'<Cell><Data ss:Type="Number">' + '' + '</Data></Cell>' + //QTY
			'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' + //COMMENTS
			'<Cell><Data ss:Type="NUMBER">' + '' + '</Data></Cell>' + //AGING_NUMBER
			'</Row>';
        }catch(e){
            log.debug("writeXml error",e.message);
        }
		}

		function NVL(n) {
			return (n ? n : 0);
		}

		function isFloat(n) {
			return n === n && n !== (n | 0);
		}

		function getSalesOrder(itemid, sDate, eDate) {
			try {
				var resultObj = {};
				var tranid = '', trandate = '', amount = '', quantity = '', currency = '', exchangerate = '';
				var department = '', salesrep = '', rate = '';
				var POSearch = search.create({
					type: "salesorder",
					columns: [
						search.createColumn({
							name: "trandate",
							sort: search.Sort.DESC,
							label: "Date"
						}),
						search.createColumn({ name: "tranid", label: "Document Number" }),
						search.createColumn({ name: "amount", label: "Amount" }),
						search.createColumn({ name: "currency", label: "Currency" }),
						search.createColumn({ name: "exchangerate", label: "exchangerate" }),
						search.createColumn({ name: "quantity", label: "Quantity" }),
						search.createColumn({ name: "rate", label: "Item Rate" }),
						search.createColumn({ name: "department", label: "DEPARTMENT" }),
						search.createColumn({ name: "salesrep", label: "SALES REP" })
					],
					filters: [
						["mainline", "any", ""],
						"AND", ["trandate", "within", sDate, eDate],
						"AND", ['item', 'anyof', itemid],
						"AND", ["type", "anyof", "SalesOrd"]
					]
				});
				POSearch.run().each(function (result) {
					tranid = result.getValue({ name: 'tranid' });
					trandate = result.getValue({ name: 'trandate' });
					amount = result.getValue({ name: 'amount' });
					currency = result.getText({ name: 'currency' });
					exchangerate = result.getValue({ name: 'exchangerate' });
					quantity = result.getValue({ name: 'quantity' });
					rate = result.getValue({ name: 'rate' });
					department = result.getText({ name: 'department' });
					salesrep = result.getText({ name: 'salesrep' });
				});

				var departArray = department.split(':');

				resultObj['tranid'] = tranid;
				resultObj['trandate'] = trandate;
				resultObj['amount'] = amount;
				resultObj['currency'] = currency;
				resultObj['exchangerate'] = exchangerate;
				resultObj['quantity'] = quantity;
				resultObj['rate'] = rate;
				resultObj['department'] = departArray[departArray.length - 1];
				resultObj['salesrep'] = salesrep;
				return resultObj;
			} catch (error) {
				log.error("getSalesOrder" + error.name, error.message);
			}
		}
		//#endregion

		return {
			getInputData: getInputData,
			map: map,
			reduce: reduce,
			summarize: summarize
		};
	});